export const API_BASE =
  typeof process !== "undefined" &&
  process.env &&
  process.env.NEXT_PUBLIC_ADMIN_API_BASE
    ? process.env.NEXT_PUBLIC_ADMIN_API_BASE
    : "/api/admin";

let accessToken = null;
let refreshToken = null;
let currentUser = null;
const sessionListeners = new Set();

function notifySession() {
  sessionListeners.forEach((l) => {
    try {
      l();
    } catch {}
  });
}

export function setSession({ access_token, refresh_token, user }) {
  accessToken = access_token || null;
  refreshToken = refresh_token || null;
  currentUser = user || null;
  try {
    const payload = {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: currentUser,
    };
    localStorage.setItem("admin_session", JSON.stringify(payload));
  } catch {}
  notifySession();
}

export function loadSession() {
  try {
    const raw = localStorage.getItem("admin_session");
    if (!raw) return null;
    const data = JSON.parse(raw);
    accessToken = data.access_token || null;
    refreshToken = data.refresh_token || null;
    currentUser = data.user || null;
    notifySession();
    return data;
  } catch {
    return null;
  }
}

export function clearSession() {
  accessToken = null;
  refreshToken = null;
  currentUser = null;
  try {
    localStorage.removeItem("admin_session");
  } catch {}
  notifySession();
}

export function subscribeSession(listener) {
  sessionListeners.add(listener);
  try {
    loadSession();
  } catch {}
  return () => {
    sessionListeners.delete(listener);
  };
}

async function doFetch(path, init = {}, retryOn401 = true) {
  const headers = new Headers(init.headers || {});
  if (!(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });
  if (res.status === 401 && retryOn401) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      return doFetch(path, init, false);
    }
  }
  return res;
}

async function doFetchJSON(path, init = {}) {
  const res = await doFetch(path, init, true);
  let json = null;
  try {
    json = await res.json();
  } catch {}
  const msg = json?.message || "";
  const bodyUnauthorized = json?.code === 401 || /token tidak valid/i.test(msg);
  if (res.status === 401 || bodyUnauthorized) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      const res2 = await doFetch(path, init, false);
      const json2 = await res2.json();
      return { res: res2, json: json2 };
    }
    throw new Error(json?.message || "Token tidak valid");
  }
  return { res, json };
}

async function tryRefreshToken() {
  try {
    const body =
      refreshToken ? JSON.stringify({ refresh_token: refreshToken }) : undefined;
    const headers = body ? { "Content-Type": "application/json" } : {};
    const res = await fetch(`${API_BASE}/refresh`, {
      method: "POST",
      headers,
      body,
      credentials: "include",
    });
    if (!res.ok) {
      clearSession();
      if (typeof window !== "undefined" && window.location && window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
      return false;
    }
    const json = await res.json();
    if (json?.data?.access_token) {
      setSession({
        access_token: json.data.access_token,
        refresh_token: json.data.refresh_token || refreshToken,
        user: json.data.user || currentUser,
      });
      return true;
    }
    clearSession();
    if (typeof window !== "undefined" && window.location && window.location.pathname !== "/login") {
      window.location.assign("/login");
    }
    return false;
  } catch {
    clearSession();
    if (typeof window !== "undefined" && window.location && window.location.pathname !== "/login") {
      window.location.assign("/login");
    }
    return false;
  }
}

export async function refreshSession() {
  return tryRefreshToken();
}
export async function adminLogin(email, password) {
  const res = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    credentials: "include",
  });
  const json = await res.json();
  if (!res.ok || json.code !== 200) {
    const msg =
      json?.message ||
      (res.status === 401
        ? "Kredensial tidak valid"
        : "Gagal login, coba lagi");
    throw new Error(msg);
  }
  setSession(json.data || {});
  return json.data;
}

export function getCurrentUser() {
  return currentUser;
}

export function getAccessToken() {
  return accessToken;
}

export async function fetchUsers(params = {}) {
  const usp = new URLSearchParams();
  if (params.page) usp.set("page", String(params.page));
  if (params.per_page) usp.set("per_page", String(params.per_page));
  if (params.q != null && params.q !== "") usp.set("q", params.q);
  if (params.disabled != null) usp.set("disabled", String(params.disabled));
  if (params.is_premium != null) usp.set("is_premium", String(params.is_premium));
  if (params.sort) usp.set("sort", params.sort);
  const path =
    params.q && params.q.trim() !== "" ? "/users/search" : "/users";
  const { res, json } = await doFetchJSON(`${path}?${usp.toString()}`);
  if (!res.ok || json?.code !== 200) throw new Error(json?.message || "Gagal memuat users");
  return json;
}

export async function fetchUser(id) {
  const { res, json } = await doFetchJSON(`/users/${id}`);
  if (!res.ok || json?.code !== 200) throw new Error(json?.message || "Gagal memuat user");
  return json;
}

export async function updateUser(id, payload) {
  const { res, json } = await doFetchJSON(`/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  if (!res.ok || json?.code !== 200) throw new Error(json?.message || "Gagal mengubah user");
  return json;
}

export async function deleteUser(id) {
  const { res, json } = await doFetchJSON(`/users/${id}`, { method: "DELETE" });
  if (!res.ok || json?.code !== 200) throw new Error(json?.message || "Gagal menghapus user");
  return json;
}

export async function fetchPaymentStats() {
  const { res, json } = await doFetchJSON(`/payments/stats`);
  if (!res.ok || json?.code !== 200) throw new Error(json?.message || "Gagal memuat statistik pembayaran");
  return json;
}

export async function fetchPaymentStatsRange(params = {}) {
  const usp = new URLSearchParams();
  if (params.range) usp.set("range", params.range);
  if (params.from) usp.set("from", params.from);
  if (params.to) usp.set("to", params.to);
  if (params.currency) usp.set("currency", params.currency);
  const { res, json } = await doFetchJSON(`/payments/stats/range?${usp.toString()}`);
  if (!res.ok || json?.code !== 200) throw new Error(json?.message || "Gagal memuat statistik rentang pembayaran");
  return json;
}

export async function fetchPaymentStatsDaily(params = {}) {
  const usp = new URLSearchParams();
  if (params.range) usp.set("range", params.range);
  if (params.from) usp.set("from", params.from);
  if (params.to) usp.set("to", params.to);
  if (params.days) usp.set("days", String(params.days));
  if (params.status) usp.set("status", params.status);
  if (params.currency) usp.set("currency", params.currency);
  const { res, json } = await doFetchJSON(`/payments/stats/daily?${usp.toString()}`);
  if (!res.ok || json?.code !== 200) throw new Error(json?.message || "Gagal memuat statistik harian pembayaran");
  return json;
}

export async function fetchPaymentStatsProviders(params = {}) {
  const usp = new URLSearchParams();
  if (params.range) usp.set("range", params.range);
  if (params.from) usp.set("from", params.from);
  if (params.to) usp.set("to", params.to);
  const { res, json } = await doFetchJSON(`/payments/stats/providers?${usp.toString()}`);
  if (!res.ok || json?.code !== 200) throw new Error(json?.message || "Gagal memuat statistik provider pembayaran");
  return json;
}

export async function fetchRevenueTrend(params = {}) {
  const usp = new URLSearchParams();
  if (params.currency) usp.set("currency", params.currency);
  if (params.period) usp.set("period", params.period);
  const { res, json } = await doFetchJSON(`/payments/revenue/trend?${usp.toString()}`);
  if (!res.ok || json?.code !== 200) throw new Error(json?.message || "Gagal memuat trend revenue");
  return json;
}

export async function fetchPaymentOrders(params = {}) {
  const usp = new URLSearchParams();
  if (params.page) usp.set("page", String(params.page));
  if (params.per_page) usp.set("per_page", String(params.per_page));
  if (params.q != null && params.q !== "") usp.set("q", params.q);
  if (params.status) usp.set("status", params.status);
  if (params.provider) usp.set("provider", params.provider);
  if (params.created_from) usp.set("created_from", params.created_from);
  if (params.created_to) usp.set("created_to", params.created_to);
  const { res, json } = await doFetchJSON(`/payments/orders?${usp.toString()}`);
  if (!res.ok || json?.code !== 200) throw new Error(json?.message || "Gagal memuat orders");
  return json;
}

export async function fetchOrdersByProvider() {
  const { res, json } = await doFetchJSON(`/payments/orders/by-provider`);
  if (!res.ok || json?.code !== 200) throw new Error(json?.message || "Gagal memuat distribusi provider");
  return json;
}

export async function fetchOrdersByStatusTrend(params = {}) {
  const usp = new URLSearchParams();
  if (params.period) usp.set("period", params.period);
  const { res, json } = await doFetchJSON(`/payments/orders/by-status-trend?${usp.toString()}`);
  if (!res.ok || json?.code !== 200) throw new Error(json?.message || "Gagal memuat trend status order");
  return json;
}

export async function updatePaymentOrderStatus(id, payload) {
  const body = {
    status: payload?.status,
    apply_premium: !!payload?.apply_premium,
  };
  const { res, json } = await doFetchJSON(`/payments/orders/${id}/status`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  if (!res.ok || json?.code !== 200) throw new Error(json?.message || "Gagal memperbarui status order");
  return json;
}

export async function fetchPaymentOrder(id) {
  const { res, json } = await doFetchJSON(`/payments/orders/${id}`);
  if (!res.ok || json?.code !== 200) throw new Error(json?.message || "Gagal memuat detail order");
  return json;
}

export async function syncPaymentOrder(invoice) {
  const { res, json } = await doFetchJSON(`/payments/orders/${invoice}/sync`, { method: "POST" });
  if (!res.ok || json?.code !== 200) throw new Error(json?.message || "Gagal sinkron status order");
  return json;
}

export async function syncPaymentOrderById(id) {
  const { res, json } = await doFetchJSON(`/payments/orders/${id}/sync`, { method: "POST" });
  if (!res.ok || json?.code !== 200) throw new Error(json?.message || "Gagal sinkron status order");
  return json;
}

export async function createPaymentOrder(payload = {}) {
  const body = {
    user_id: payload.user_id,
    amount: payload.amount,
    currency: payload.currency || "IDR",
    provider: payload.provider || "manual",
    method: payload.method || undefined,
    expires_at: payload.expires_at || undefined,
    note: payload.note || undefined,
    premium_days: payload.premium_days || undefined,
  };
  const { res, json } = await doFetchJSON(`/payments/orders`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!res.ok || json?.code !== 200) throw new Error(json?.message || "Gagal membuat order");
  return json;
}

export async function resendPaymentOrder(id) {
  const { res, json } = await doFetchJSON(`/payments/orders/${id}/resend`, { method: "POST" });
  if (!res.ok || json?.code !== 200) throw new Error(json?.message || "Gagal kirim ulang instruksi");
  return json;
}

export async function cancelPaymentOrder(id) {
  const { res, json } = await doFetchJSON(`/payments/orders/${id}/cancel`, { method: "POST" });
  if (!res.ok || json?.code !== 200) throw new Error(json?.message || "Gagal membatalkan order");
  return json;
}

export async function refundPaymentOrder(id, payload = {}) {
  const body = {
    amount: payload.amount,
    reason: payload.reason || undefined,
  };
  const { res, json } = await doFetchJSON(`/payments/orders/${id}/refund`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!res.ok || json?.code !== 200) throw new Error(json?.message || "Gagal melakukan refund");
  return json;
}

export async function applyPremiumPaymentOrder(id, payload = {}) {
  const body = {
    days: payload.days || undefined,
  };
  const { res, json } = await doFetchJSON(`/payments/orders/${id}/apply-premium`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!res.ok || json?.code !== 200) throw new Error(json?.message || "Gagal menerapkan premium");
  return json;
}

export function buildPaymentOrdersExportURL(params = {}) {
  const usp = new URLSearchParams();
  if (params.status) usp.set("status", params.status);
  if (params.provider) usp.set("provider", params.provider);
  if (params.created_from) usp.set("created_from", params.created_from);
  if (params.created_to) usp.set("created_to", params.created_to);
  return `${API_BASE}/payments/orders/export?${usp.toString()}`;
}

export async function downloadPaymentOrdersCSV(params = {}) {
  const usp = new URLSearchParams();
  if (params.status) usp.set("status", params.status);
  if (params.provider) usp.set("provider", params.provider);
  if (params.created_from) usp.set("created_from", params.created_from);
  if (params.created_to) usp.set("created_to", params.created_to);
  const path = `/payments/orders/export?${usp.toString()}`;
  const res = await doFetch(
    path,
    { method: "GET", headers: { Accept: "text/csv" } },
    true
  );
  if (!res.ok) {
    try {
      const json = await res.json();
      throw new Error(json?.message || "Gagal mengekspor CSV");
    } catch {
      const text = await res.text();
      throw new Error(text || "Gagal mengekspor CSV");
    }
  }
  const blob = await res.blob();
  return blob;
}

export async function fetchPaymentOrderActivity(id) {
  const { res, json } = await doFetchJSON(`/payments/orders/${id}/activity`);
  if (!res.ok || json?.code !== 200) throw new Error(json?.message || "Gagal memuat aktivitas order");
  return json;
}

export async function fetchPaymentProviders() {
  const { res, json } = await doFetchJSON(`/payments/providers`);
  if (!res.ok || json?.code !== 200) throw new Error(json?.message || "Gagal memuat providers");
  return json;
}

export async function createPaymentProvider(payload = {}) {
  const body = {
    code: payload.code,
    name: payload.name,
    description: payload.description,
    selected: !!payload.selected,
    methods: Array.isArray(payload.methods) ? payload.methods : undefined,
  };
  const { res, json } = await doFetchJSON(`/payments/providers`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!res.ok || json?.code !== 200) throw new Error(json?.message || "Gagal membuat provider");
  return json;
}

export async function updatePaymentProvider(id, payload = {}) {
  const body = {
    name: payload.name,
    description: payload.description,
    selected: payload.selected,
    methods: payload.methods,
  };
  const { res, json } = await doFetchJSON(`/payments/providers/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  if (!res.ok || json?.code !== 200) throw new Error(json?.message || "Gagal memperbarui provider");
  return json;
}

export async function deletePaymentProvider(id) {
  const { res, json } = await doFetchJSON(`/payments/providers/${id}`, {
    method: "DELETE",
  });
  if (!res.ok || json?.code !== 200) throw new Error(json?.message || "Gagal menghapus provider");
  return json;
}

export async function fetchProviderMethods(providerId) {
  const { res, json } = await doFetchJSON(`/payments/providers/${providerId}/methods`);
  if (!res.ok || json?.code !== 200) throw new Error(json?.message || "Gagal memuat methods provider");
  return json;
}

export async function updateProviderMethod(methodId, payload = {}) {
  const body = {
    code: payload.code,
    name: payload.name,
    group: payload.group,
  };
  const { res, json } = await doFetchJSON(`/payments/providers/methods/${methodId}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  if (!res.ok || json?.code !== 200) throw new Error(json?.message || "Gagal memperbarui method");
  return json;
}

export async function deleteProviderMethod(methodId) {
  const { res, json } = await doFetchJSON(`/payments/providers/methods/${methodId}`, {
    method: "DELETE",
  });
  if (!res.ok || json?.code !== 200) throw new Error(json?.message || "Gagal menghapus method");
  return json;
}

export async function fetchPaymentsConfig() {
  const { res, json } = await doFetchJSON(`/payments/config`);
  if (!res.ok || json?.code !== 200) throw new Error(json?.message || "Gagal memuat konfigurasi pembayaran");
  return json;
}

export async function fetchPaymentsConfigSummary() {
  const { res, json } = await doFetchJSON(`/payments/config/summary`);
  if (!res.ok || json?.code !== 200) throw new Error(json?.message || "Gagal memuat ringkasan konfigurasi pembayaran");
  return json;
}

export async function fetchPaymentsSetup() {
  const { res, json } = await doFetchJSON(`/payments/setup`);
  if (!res.ok || json?.code !== 200) throw new Error(json?.message || "Gagal memuat setup pembayaran");
  return json;
}

export async function updatePaymentsConfig(payload = {}) {
  const body = {
    enabled_providers: payload.enabled_providers,
    current_provider: payload.current_provider,
    payments_enabled: !!payload.payments_enabled,
  };
  const { res, json } = await doFetchJSON(`/payments/config`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  if (!res.ok || json?.code !== 200) throw new Error(json?.message || "Gagal memperbarui konfigurasi pembayaran");
  return json;
}

export async function updatePaymentsSetup(payload = {}) {
  const body = {
    enabled_providers: payload.enabled_providers,
    current_provider: payload.current_provider,
    payments_enabled: !!payload.payments_enabled,
  };
  const { res, json } = await doFetchJSON(`/payments/setup`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  if (!res.ok || json?.code !== 200) throw new Error(json?.message || "Gagal memperbarui setup pembayaran");
  return json;
}

export async function fetchPaymentMethods(provider) {
  const usp = new URLSearchParams();
  if (provider) usp.set("provider", provider);
  const { res, json } = await doFetchJSON(`/payments/methods?${usp.toString()}`);
  if (!res.ok || json?.code !== 200) throw new Error(json?.message || "Gagal memuat methods");
  return json;
}

export async function fetchPaymentPlans() {
  const usp = new URLSearchParams();
  if (arguments[0] && arguments[0].active_only === true) usp.set("active_only", "true");
  const qs = usp.toString();
  const path = qs ? `/payments/plans?${qs}` : `/payments/plans`;
  const { res, json } = await doFetchJSON(path);
  if (!res.ok || json?.code !== 200) throw new Error(json?.message || "Gagal memuat payment plans");
  return json;
}

export async function createPaymentPlan(payload = {}) {
  const body = {
    label: payload.label,
    description: payload.description,
    amount: payload.amount,
    currency: payload.currency || "IDR",
    period: payload.period,
    duration_count: payload.duration_count,
    code: payload.code || undefined,
    discount_percent: payload.discount_percent || undefined,
    discount_amount: payload.discount_amount || undefined,
    active: payload.active != null ? !!payload.active : undefined,
    sort_order: payload.sort_order || undefined,
  };
  const { res, json } = await doFetchJSON(`/payments/plans`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!res.ok || !(json?.code === 200 || json?.code === 201)) throw new Error(json?.message || "Gagal membuat payment plan");
  return json;
}

export async function updatePaymentPlan(id, payload = {}) {
  const body = {
    label: payload.label,
    description: payload.description,
    amount: payload.amount,
    currency: payload.currency,
    period: payload.period,
    duration_count: payload.duration_count,
    code: payload.code,
    discount_percent: payload.discount_percent,
    discount_amount: payload.discount_amount,
    active: payload.active,
    sort_order: payload.sort_order,
  };
  const { res, json } = await doFetchJSON(`/payments/plans/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  if (!res.ok || !(json?.code === 200 || json?.code === 201)) throw new Error(json?.message || "Gagal memperbarui payment plan");
  return json;
}

export async function deletePaymentPlan(id) {
  const { res, json } = await doFetchJSON(`/payments/plans/${id}`, {
    method: "DELETE",
  });
  if (!res.ok || !(json?.code === 200 || json?.code === 204)) throw new Error(json?.message || "Gagal menghapus payment plan");
  return json;
}

export async function fetchPaymentWebhookLogs(params = {}) {
  const usp = new URLSearchParams();
  if (params.provider) usp.set("provider", params.provider);
  if (params.status) usp.set("status", params.status);
  if (params.from) usp.set("from", params.from);
  if (params.to) usp.set("to", params.to);
  const { res, json } = await doFetchJSON(`/payments/webhooks/logs?${usp.toString()}`);
  if (!res.ok || json?.code !== 200) throw new Error(json?.message || "Gagal memuat log webhook");
  return json;
}

export async function fetchTopPaymentUsers(params = {}) {
  const usp = new URLSearchParams();
  if (params.limit) usp.set("limit", String(params.limit));
  const { res, json } = await doFetchJSON(`/payments/top-users?${usp.toString()}`);
  if (!res.ok || json?.code !== 200) throw new Error(json?.message || "Gagal memuat top users pembayaran");
  return json;
}

export async function fetchTopPaymentUsersStats(params = {}) {
  const usp = new URLSearchParams();
  if (params.range) usp.set("range", params.range);
  if (params.from) usp.set("from", params.from);
  if (params.to) usp.set("to", params.to);
  if (params.limit) usp.set("limit", String(params.limit));
  const { res, json } = await doFetchJSON(`/payments/stats/top-users?${usp.toString()}`);
  if (!res.ok || json?.code !== 200) throw new Error(json?.message || "Gagal memuat statistik top users pembayaran");
  return json;
}

export async function fetchSeries(params = {}) {
  const usp = new URLSearchParams();
  if (params.page) usp.set("page", String(params.page));
  if (params.per_page) usp.set("per_page", String(params.per_page));
  if (params.q != null && params.q !== "") usp.set("q", params.q);
  const { res, json } = await doFetchJSON(`/series?${usp.toString()}`);
  if (!res.ok || json?.code !== 200) throw new Error(json?.message || "Gagal memuat series");
  return json;
}

export async function fetchSeriesDetail(id) {
  const { res, json } = await doFetchJSON(`/series/${id}`);
  if (!res.ok || json?.code !== 200) throw new Error(json?.message || "Gagal memuat series");
  return json;
}

export async function fetchSeriesRecent(params = {}) {
  const usp = new URLSearchParams();
  if (params.limit) usp.set("limit", String(params.limit));
  const { res, json } = await doFetchJSON(`/series/recent?${usp.toString()}`);
  if (!res.ok || json?.code !== 200) throw new Error(json?.message || "Gagal memuat series terbaru");
  return json;
}

export async function createSeries(payload) {
  const { res, json } = await doFetchJSON(`/series`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok || json?.code !== 200) throw new Error(json?.message || "Gagal membuat series");
  return json;
}

export async function updateSeries(id, payload) {
  const { res, json } = await doFetchJSON(`/series/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  if (!res.ok || json?.code !== 200) throw new Error(json?.message || "Gagal memperbarui series");
  return json;
}

export async function deleteSeries(id) {
  const { res, json } = await doFetchJSON(`/series/${id}`, { method: "DELETE" });
  if (!res.ok || json?.code !== 200) throw new Error(json?.message || "Gagal menghapus series");
  return json;
}

export async function fetchTags(params = {}) {
  const usp = new URLSearchParams();
  if (params.page) usp.set("page", String(params.page));
  if (params.per_page) usp.set("per_page", String(params.per_page));
  if (params.q != null && params.q !== "") usp.set("q", params.q);
  const { res, json } = await doFetchJSON(`/tags?${usp.toString()}`);
  if (!res.ok || json?.code !== 200) throw new Error(json?.message || "Gagal memuat tags");
  return json;
}

export async function fetchTag(id) {
  const { res, json } = await doFetchJSON(`/tags/${id}`);
  if (!res.ok || json?.code !== 200) throw new Error(json?.message || "Gagal memuat tag");
  return json;
}

export async function fetchTagUsageTop(params = {}) {
  const usp = new URLSearchParams();
  if (params.top) usp.set("top", String(params.top));
  const { res, json } = await doFetchJSON(`/tags/usage?${usp.toString()}`);
  if (!res.ok || json?.code !== 200) throw new Error(json?.message || "Gagal memuat penggunaan tag teratas");
  return json;
}

export async function createTag(payload) {
  const { res, json } = await doFetchJSON(`/tags`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok || json?.code !== 200) throw new Error(json?.message || "Gagal membuat tag");
  return json;
}

export async function updateTag(id, payload) {
  const { res, json } = await doFetchJSON(`/tags/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  if (!res.ok || json?.code !== 200) throw new Error(json?.message || "Gagal memperbarui tag");
  return json;
}

export async function deleteTag(id) {
  const { res, json } = await doFetchJSON(`/tags/${id}`, { method: "DELETE" });
  if (!res.ok || json?.code !== 200) throw new Error(json?.message || "Gagal menghapus tag");
  return json;
}

export async function fetchEpisodes(params = {}) {
  const usp = new URLSearchParams();
  if (params.page) usp.set("page", String(params.page));
  if (params.per_page) usp.set("per_page", String(params.per_page));
  if (params.q != null && params.q !== "") usp.set("q", params.q);
  if (params.series_id) usp.set("series_id", params.series_id);
  const { res, json } = await doFetchJSON(`/episodes?${usp.toString()}`);
  if (!res.ok || json?.code !== 200) throw new Error(json?.message || "Gagal memuat episodes");
  return json;
}

export async function fetchEpisode(id) {
  const { res, json } = await doFetchJSON(`/episodes/${id}`);
  if (!res.ok || json?.code !== 200) throw new Error(json?.message || "Gagal memuat episode");
  return json;
}

export async function fetchEpisodesRecent(params = {}) {
  const usp = new URLSearchParams();
  if (params.limit) usp.set("limit", String(params.limit));
  if (params.embed) usp.set("embed", params.embed);
  const { res, json } = await doFetchJSON(`/episodes/recent?${usp.toString()}`);
  if (!res.ok || json?.code !== 200) throw new Error(json?.message || "Gagal memuat episodes terbaru");
  return json;
}

export async function fetchEpisodesSizeAggregate(params = {}) {
  const usp = new URLSearchParams();
  if (params.group) usp.set("group", params.group);
  if (params.period) usp.set("period", params.period);
  const { res, json } = await doFetchJSON(`/episodes/size/aggregate?${usp.toString()}`);
  if (!res.ok || json?.code !== 200) throw new Error(json?.message || "Gagal memuat agregasi ukuran episode");
  return json;
}

export async function createEpisode(payload) {
  const { res, json } = await doFetchJSON(`/episodes`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok || json?.code !== 200) throw new Error(json?.message || "Gagal membuat episode");
  return json;
}

export async function updateEpisode(id, payload) {
  const { res, json } = await doFetchJSON(`/episodes/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  if (!res.ok || json?.code !== 200) throw new Error(json?.message || "Gagal memperbarui episode");
  return json;
}

export async function deleteEpisode(id) {
  const { res, json } = await doFetchJSON(`/episodes/${id}`, { method: "DELETE" });
  if (!res.ok || json?.code !== 200) throw new Error(json?.message || "Gagal menghapus episode");
  return json;
}

export async function fetchContentStats() {
  const { res, json } = await doFetchJSON(`/content/stats`);
  if (!res.ok || json?.code !== 200) throw new Error(json?.message || "Gagal memuat statistik konten");
  return json;
}

export async function fetchNewUsersTrend(params = {}) {
  const usp = new URLSearchParams();
  if (params.period) usp.set("period", params.period);
  const { res, json } = await doFetchJSON(`/users/new/trend?${usp.toString()}`);
  if (!res.ok || json?.code !== 200) throw new Error(json?.message || "Gagal memuat trend user baru");
  return json;
}
export async function fetchAppAds(params = {}) {
  const usp = new URLSearchParams();
  if (params.type) usp.set("type", params.type);
  if (params.status) usp.set("status", params.status);
  if (params.page) usp.set("page", String(params.page));
  if (params.per_page) usp.set("per_page", String(params.per_page));
  const { res, json } = await doFetchJSON(`/app/ads?${usp.toString()}`);
  if (!res.ok || json?.code !== 200) throw new Error(json?.message || "Gagal memuat ads");
  return json;
}

export async function createAppAd(payload = {}) {
  const body = {
    unit_name: payload.unit_name,
    unit_description: payload.unit_description,
    type: payload.type,
    app_id: payload.app_id,
    native_code: payload.native_code,
    interstitial_code: payload.interstitial_code,
    banner_code: payload.banner_code,
    app_open_code: payload.app_open_code,
    reward_code: payload.reward_code,
    status: payload.status,
  };
  const { res, json } = await doFetchJSON(`/app/ads`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(json?.message || "Gagal membuat ads");
  return json;
}

export async function updateAppAd(id, payload = {}) {
  const body = {
    unit_name: payload.unit_name,
    unit_description: payload.unit_description,
    type: payload.type,
    app_id: payload.app_id,
    native_code: payload.native_code,
    interstitial_code: payload.interstitial_code,
    banner_code: payload.banner_code,
    app_open_code: payload.app_open_code,
    reward_code: payload.reward_code,
    status: payload.status,
  };
  const { res, json } = await doFetchJSON(`/app/ads/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(json?.message || "Gagal mengubah ads");
  return json;
}

export async function deleteAppAd(id) {
  const { res, json } = await doFetchJSON(`/app/ads/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(json?.message || "Gagal menghapus ads");
  return json;
}

export async function fetchAppNotifications(params = {}) {
  const usp = new URLSearchParams();
  if (params.page) usp.set("page", String(params.page));
  if (params.per_page) usp.set("per_page", String(params.per_page));
  const { res, json } = await doFetchJSON(`/app/notifications?${usp.toString()}`);
  if (!res.ok || json?.code !== 200) throw new Error(json?.message || "Gagal memuat notifications");
  return json;
}

export async function fetchAppNotification(id) {
  const { res, json } = await doFetchJSON(`/app/notifications/${id}`);
  if (!res.ok || json?.code !== 200) throw new Error(json?.message || "Gagal memuat notification");
  return json;
}

export async function createAppNotification(payload = {}) {
  const form = new FormData();
  form.append("unit_name", payload.unit_name);
  if (payload.unit_description != null) form.append("unit_description", payload.unit_description);
  form.append("url", payload.url);
  if (!(payload.image instanceof File)) {
    throw new Error("Gambar wajib diisi");
  }
  form.append("image", payload.image);
  const { res, json } = await doFetchJSON(`/app/notifications`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error(json?.message || "Gagal membuat notification");
  return json;
}

export async function updateAppNotification(id, payload = {}) {
  const form = new FormData();
  if (payload.unit_name != null) form.append("unit_name", payload.unit_name);
  if (payload.unit_description != null) form.append("unit_description", payload.unit_description);
  if (payload.url != null) form.append("url", payload.url);
  if (payload.image instanceof File) form.append("image", payload.image);
  const { res, json } = await doFetchJSON(`/app/notifications/${id}`, {
    method: "PUT",
    body: form,
  });
  if (!res.ok) throw new Error(json?.message || "Gagal mengubah notification");
  return json;
}

export async function deleteAppNotification(id) {
  const { res, json } = await doFetchJSON(`/app/notifications/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(json?.message || "Gagal menghapus notification");
  return json;
}

export async function fetchAppRedirects(params = {}) {
  const usp = new URLSearchParams();
  if (params.page) usp.set("page", String(params.page));
  if (params.per_page) usp.set("per_page", String(params.per_page));
  const { res, json } = await doFetchJSON(`/app/redirects?${usp.toString()}`);
  if (!res.ok || json?.code !== 200) throw new Error(json?.message || "Gagal memuat redirects");
  return json;
}

export async function fetchAppRedirect(id) {
  const { res, json } = await doFetchJSON(`/app/redirects/${id}`);
  if (!res.ok || json?.code !== 200) throw new Error(json?.message || "Gagal memuat redirect");
  return json;
}

export async function createAppRedirect(payload = {}) {
  const form = new FormData();
  form.append("unit_name", payload.unit_name);
  if (payload.unit_description != null) form.append("unit_description", payload.unit_description);
  form.append("title", payload.title);
  if (payload.description != null) form.append("description", payload.description);
  form.append("url", payload.url);
  if (payload.image instanceof File) form.append("image", payload.image);
  const { res, json } = await doFetchJSON(`/app/redirects`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error(json?.message || "Gagal membuat redirect");
  return json;
}

export async function updateAppRedirect(id, payload = {}) {
  const form = new FormData();
  if (payload.unit_name != null) form.append("unit_name", payload.unit_name);
  if (payload.unit_description != null) form.append("unit_description", payload.unit_description);
  if (payload.title != null) form.append("title", payload.title);
  if (payload.description != null) form.append("description", payload.description);
  if (payload.url != null) form.append("url", payload.url);
  if (payload.image instanceof File) form.append("image", payload.image);
  const { res, json } = await doFetchJSON(`/app/redirects/${id}`, {
    method: "PUT",
    body: form,
  });
  if (!res.ok) throw new Error(json?.message || "Gagal mengubah redirect");
  return json;
}

export async function deleteAppRedirect(id) {
  const { res, json } = await doFetchJSON(`/app/redirects/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(json?.message || "Gagal menghapus redirect");
  return json;
}

export async function fetchAppAnnounces(params = {}) {
  const usp = new URLSearchParams();
  if (params.page) usp.set("page", String(params.page));
  if (params.per_page) usp.set("per_page", String(params.per_page));
  const { res, json } = await doFetchJSON(`/app/announces?${usp.toString()}`);
  if (!res.ok || json?.code !== 200) throw new Error(json?.message || "Gagal memuat announces");
  return json;
}

export async function fetchAppAnnounce(id) {
  const { res, json } = await doFetchJSON(`/app/announces/${id}`);
  if (!res.ok || json?.code !== 200) throw new Error(json?.message || "Gagal memuat announce");
  return json;
}

export async function createAppAnnounce(payload = {}) {
  const body = {
    unit_name: payload.unit_name,
    unit_description: payload.unit_description,
    content: payload.content,
  };
  const { res, json } = await doFetchJSON(`/app/announces`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(json?.message || "Gagal membuat announce");
  return json;
}

export async function updateAppAnnounce(id, payload = {}) {
  const body = {
    unit_name: payload.unit_name,
    unit_description: payload.unit_description,
    content: payload.content,
  };
  const { res, json } = await doFetchJSON(`/app/announces/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(json?.message || "Gagal mengubah announce");
  return json;
}

export async function deleteAppAnnounce(id) {
  const { res, json } = await doFetchJSON(`/app/announces/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(json?.message || "Gagal menghapus announce");
  return json;
}

export async function fetchAppConfig() {
  const { res, json } = await doFetchJSON(`/app/config`);
  if (!res.ok || json?.code !== 200) throw new Error(json?.message || "Gagal memuat konfigurasi UI");
  return json;
}

export async function updateAppConfig(payload = {}) {
  const body = {
    global: payload.global,
    notification: payload.notification,
    ads: payload.ads,
    redirect: payload.redirect,
    announce: payload.announce,
  };
  const { res, json } = await doFetchJSON(`/app/config`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(json?.message || "Gagal memperbarui konfigurasi UI");
  return json;
}

export async function fetchAdminSettings() {
  const { res, json } = await doFetchJSON(`/settings`);
  if (!res.ok || json?.code !== 200) throw new Error(json?.message || "Gagal memuat settings");
  return json;
}

export async function updateAdminSettings(payload = {}) {
  const { res, json } = await doFetchJSON(`/settings`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  if (!res.ok || !(json?.code === 200 || json?.code === 204)) throw new Error(json?.message || "Gagal memperbarui settings");
  return json;
}

export async function getAdminSetting(key) {
  const { res, json } = await doFetchJSON(`/settings/${encodeURIComponent(key)}`);
  if (!res.ok || json?.code !== 200) throw new Error(json?.message || "Gagal memuat setting");
  return json;
}

export async function upsertAdminSetting(key, value) {
  const { res, json } = await doFetchJSON(`/settings/${encodeURIComponent(key)}`, {
    method: "PUT",
    body: JSON.stringify({ value }),
  });
  if (!res.ok || !(json?.code === 200 || json?.code === 204)) throw new Error(json?.message || "Gagal menyimpan setting");
  return json;
}

export async function deleteAdminSetting(key) {
  const { res, json } = await doFetchJSON(`/settings/${encodeURIComponent(key)}`, { method: "DELETE" });
  if (!res.ok || !(json?.code === 200 || json?.code === 204)) throw new Error(json?.message || "Gagal menghapus setting");
  return json;
}

export async function startScan(payload = {}) {
  const body = {};
  if (Array.isArray(payload.top_folders)) body.top_folders = payload.top_folders;
  if (payload.batch_size != null) body.batch_size = payload.batch_size;
  if (payload.pause_ms != null) body.pause_ms = payload.pause_ms;
  if (payload.interval_ms != null) body.interval_ms = payload.interval_ms;
  const { res, json } = await doFetchJSON(`/scan/start`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!res.ok || !(json?.code === 200 || json?.code === 204)) throw new Error(json?.message || "Gagal memulai scan");
  return json;
}

export async function stopScan() {
  const { res, json } = await doFetchJSON(`/scan/stop`, { method: "POST" });
  if (!res.ok || !(json?.code === 200 || json?.code === 204)) throw new Error(json?.message || "Gagal menghentikan scan");
  return json;
}

export async function fetchScanRealtime() {
  const { res, json } = await doFetchJSON(`/scan/realtime`);
  if (!res.ok || json?.code !== 200) throw new Error(json?.message || "Gagal memuat realtime");
  return json;
}

export async function fetchScanReportCurrent() {
  const { res, json } = await doFetchJSON(`/scan/report/current`);
  if (!res.ok || json?.code !== 200) throw new Error(json?.message || "Gagal memuat laporan berjalan");
  return json;
}

export async function fetchScanReportSummary() {
  const { res, json } = await doFetchJSON(`/scan/report/summary`);
  if (!res.ok || json?.code !== 200) throw new Error(json?.message || "Gagal memuat ringkasan database");
  return json;
}

 
