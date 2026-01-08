"use client";

import { BarChart } from "@/components/ui/BarChart";
import { Card } from "@/components/ui/Card";
import { DonutChart } from "@/components/ui/DonutChart";
import Icon from "@/components/ui/Icon";
import { StatCard } from "@/components/ui/StatCard";
import {
  fetchAppAnnounce,
  fetchAppAnnounces,
  fetchAppConfig,
  fetchAppNotification,
  fetchAppNotifications,
  fetchAppRedirect,
  fetchAppRedirects,
  fetchContentStats,
  fetchEpisodesRecent,
  fetchEpisodesSizeAggregate,
  fetchNewUsersTrend,
  fetchOrdersByProvider,
  fetchOrdersByStatusTrend,
  fetchPaymentStats,
  fetchRevenueTrend,
  fetchSeriesDetail,
  fetchSeriesRecent,
  fetchTagUsageTop,
  fetchTopPaymentUsersStats,
  fetchUser
} from "@/lib/api";
import { useEffect, useState } from "react";

function formatAmount(n) {
  try {
    return new Intl.NumberFormat("id-ID").format(n);
  } catch {
    return String(n);
  }
}

function shortText(s, n = 80) {
  if (!s) return "";
  const str = String(s);
  return str.length > n ? `${str.slice(0, n - 1)}…` : str;
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState(null);
  const [seriesCount, setSeriesCount] = useState(0);
  const [tagsCount, setTagsCount] = useState(0);
  const [episodesCount, setEpisodesCount] = useState(0);
  const [storageTotalSize, setStorageTotalSize] = useState(0);
  const [ordersByStatus, setOrdersByStatus] = useState([]);
  const [recentSeries, setRecentSeries] = useState([]);
  const [recentEpisodes, setRecentEpisodes] = useState([]);
  const [topTagsUsage, setTopTagsUsage] = useState([]);
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [ordersProviderDist, setOrdersProviderDist] = useState([]);
  const [ordersStatusTrend, setOrdersStatusTrend] = useState([]);
  const [newUsersTrend, setNewUsersTrend] = useState([]);
  const [episodesSizeAgg, setEpisodesSizeAgg] = useState([]);
  const [topUsers, setTopUsers] = useState([]);
  const [topUserLabelMap, setTopUserLabelMap] = useState({});
  const [seriesNameMap, setSeriesNameMap] = useState({});
  const [appConfig, setAppConfig] = useState(null);
  const [notifItem, setNotifItem] = useState(null);
  const [redirectItem, setRedirectItem] = useState(null);
  const [announceItem, setAnnounceItem] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [
          s,
          cs,
          tagsUsage,
          rSeries,
          rEpisodes,
          rTrend,
          oProvider,
          oStatusTrend,
          uTrend,
          eSizeAgg,
          tUsers,
          cfg,
        ] = await Promise.all([
          fetchPaymentStats(),
          fetchContentStats(),
          fetchTagUsageTop({ top: 5 }),
          fetchSeriesRecent({ limit: 5 }),
          fetchEpisodesRecent({ limit: 5, embed: "series" }),
          fetchRevenueTrend({ currency: "IDR", period: "12m" }),
          fetchOrdersByProvider(),
          fetchOrdersByStatusTrend({ period: "12m" }),
          fetchNewUsersTrend({ period: "12m" }),
          fetchEpisodesSizeAggregate({ group: "month", period: "12m" }),
          fetchTopPaymentUsersStats({ limit: 5, range: "12m" }),
          fetchAppConfig(),
        ]);
        setStats(s?.data || null);
        setSeriesCount(cs?.data?.series_total || 0);
        setTagsCount(cs?.data?.tags_total || 0);
        setEpisodesCount(cs?.data?.episodes_total || 0);
        setStorageTotalSize(cs?.data?.storage_total_size || 0);
        setRecentSeries(rSeries?.data || []);
        setRecentEpisodes(rEpisodes?.data || []);
        setTopTagsUsage((tagsUsage?.data || []).map((it) => ({
          label: it?.tag?.name || "Unknown",
          value: it?.usage || 0,
          color: "#6D4AFF",
        })));
        setRevenueTrend(rTrend?.data || []);
        setOrdersProviderDist(oProvider?.data || []);
        setOrdersStatusTrend(oStatusTrend?.data || []);
        setNewUsersTrend(uTrend?.data || []);
        setEpisodesSizeAgg(eSizeAgg?.data || []);
        const tData = tUsers?.data?.rows || tUsers?.data || [];
        console.log(tData);
        
        setTopUsers(tData);
        setAppConfig(cfg?.data || null);
        const os = s?.data?.orders || {};
        setOrdersByStatus([
          { label: "Paid", value: os.paid ?? 0, color: "#22C55E" },
          { label: "Pending", value: os.pending ?? 0, color: "#F59E0B" },
          { label: "Failed", value: os.failed ?? 0, color: "#EF4444" },
          { label: "Expired", value: os.expired ?? 0, color: "#A1A1AA" },
          { label: "Canceled", value: os.canceled ?? 0, color: "#6B7280" },
        ]);
      } catch (err) {
        setError(err?.message || "Gagal memuat data dashboard");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const load = async () => {
      const rows = Array.isArray(topUsers) ? topUsers : [];
      const ids = rows
        .map((u) => u?.user?.id || u?.user_id || u?.id)
        .filter((id) => !!id)
        .filter((id) => topUserLabelMap[id] == null);
      if (ids.length === 0) return;
      try {
        const pairs = await Promise.all(
          ids.map(async (id) => {
            try {
              const json = await fetchUser(id);
              const usr = json?.data;
              const label = usr?.email || usr?.display_name || id;
              return [id, label];
            } catch {
              return [id, id];
            }
          })
        );
        const next = { ...topUserLabelMap };
        pairs.forEach(([id, label]) => {
          next[id] = label;
        });
        setTopUserLabelMap(next);
      } catch {}
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topUsers]);

  useEffect(() => {
    const load = async () => {
      const nId = appConfig?.notification?.id;
      const rId = appConfig?.redirect?.id;
      const aId = appConfig?.announce?.id;
      try {
        if (nId) {
          let item = null;
          try {
            const res = await fetchAppNotification(nId);
            item = res?.data || null;
          } catch {}
          if (!item) {
            try {
              const list = await fetchAppNotifications({ page: 1, per_page: 100 });
              item = (list?.data || []).find((it) => it?.id === nId) || null;
            } catch {}
          }
          setNotifItem(item);
        } else {
          setNotifItem(null);
        }
        if (rId) {
          let item = null;
          try {
            const res = await fetchAppRedirect(rId);
            item = res?.data || null;
          } catch {}
          if (!item) {
            try {
              const list = await fetchAppRedirects({ page: 1, per_page: 100 });
              item = (list?.data || []).find((it) => it?.id === rId) || null;
            } catch {}
          }
          setRedirectItem(item);
        } else {
          setRedirectItem(null);
        }
        if (aId) {
          let item = null;
          try {
            const res = await fetchAppAnnounce(aId);
            item = res?.data || null;
          } catch {}
          if (!item) {
            try {
              const list = await fetchAppAnnounces({ page: 1, per_page: 100 });
              item = (list?.data || []).find((it) => it?.id === aId) || null;
            } catch {}
          }
          setAnnounceItem(item);
        } else {
          setAnnounceItem(null);
        }
      } catch {}
    };
    load();
  }, [appConfig?.notification?.id, appConfig?.redirect?.id, appConfig?.announce?.id]);

  useEffect(() => {
    const loadNames = async () => {
      const ids = Array.from(
        new Set((recentEpisodes || []).map((e) => e.series_id).filter((id) => !!id))
      ).filter((id) => seriesNameMap[id] == null);
      if (ids.length === 0) return;
      try {
        const pairs = await Promise.all(
          ids.map(async (id) => {
            try {
              const json = await fetchSeriesDetail(id);
              const name = json?.data?.name || id;
              return [id, name];
            } catch {
              return [id, id];
            }
          })
        );
        const next = { ...seriesNameMap };
        pairs.forEach(([id, name]) => {
          next[id] = name;
        });
        setSeriesNameMap(next);
      } catch {}
    };
    loadNames();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recentEpisodes]);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-black">Dashboard</h1>
        <p className="text-sm text-zinc-700">Ringkasan panel admin.</p>
      </div>

      {error ? (
        <div className="rounded-xl border border-black/10 bg-white p-4 shadow-sm">
          <div className="text-red-600">{error}</div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <StatCard
              title="Total Users"
              icon="users"
              value={String(stats?.users?.total ?? (loading ? "…" : "—"))}
              delta={stats?.users?.active != null ? `${stats?.users?.active} aktif` : null}
              deltaDirection="up"
            />
            <StatCard
              title="Orders"
              icon="payments"
              value={String(stats?.orders?.total ?? (loading ? "…" : "—"))}
              delta={stats?.orders?.paid != null ? `${stats?.orders?.paid} paid` : null}
              deltaDirection="up"
            />
            <StatCard
              title="Revenue (IDR)"
              icon="dashboard"
              value={`${formatAmount((stats?.revenue || []).find((r) => r.currency === "IDR")?.total_amount ?? 0)} IDR`}
              hint={`Orders: ${(stats?.revenue || []).find((r) => r.currency === "IDR")?.count ?? 0}`}
            />
            <StatCard
              title="Storage Total"
              icon="dashboard"
              value={`${formatAmount(Math.round((storageTotalSize || 0) / (1024 * 1024 * 1024)))} GB`}
              hint={`${formatAmount(storageTotalSize || 0)} bytes`}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <StatCard
              title="Config Aktif"
              icon="dot"
              status={appConfig?.global?.isActive === true}
              value={null}
            />
            <StatCard
              title="Mode Live"
              icon="dot"
              status={appConfig?.global?.isLive === true}
              value={null}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <StatCard
              title="Notification"
              icon="dot"
              status={appConfig?.notification?.isEnable === true}
              size="sm"
              className="border-[#6D4AFF]/15 transition hover:border-[#6D4AFF]/30 hover:bg-[#F8F7FF]"
              value={
                notifItem ? (
                  <div className="flex items-center gap-2">
                    <span>{notifItem?.unit_name || notifItem?.title || notifItem?.id}</span>
                    {notifItem?.url && (
                      <a
                        href={notifItem.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center rounded-full bg-[#F0EFFF] px-2.5 py-[2px] text-[11px] text-[#6D4AFF]"
                      >
                        <span className="mr-1">
                          <Icon name="link" size={12} />
                        </span>
                        Link
                      </a>
                    )}
                  </div>
                ) : null
              }
              hint={
                (() => {
                  const url = notifItem?.url || null;
                  const desc = notifItem?.unit_description || null;
                  return (
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {desc && (
                        <span className="text-[12px] text-zinc-700">{shortText(desc, 64)}</span>
                      )}
                    </div>
                  );
                })()
              }
            />
            <StatCard
              title="Redirect"
              icon="dot"
              status={appConfig?.redirect?.isEnable === true}
              size="sm"
              className="border-[#6D4AFF]/15 transition hover:border-[#6D4AFF]/30 hover:bg-[#F8F7FF]"
              value={
                redirectItem ? (
                  <div className="flex items-center gap-2">
                    <span>{redirectItem?.title || redirectItem?.unit_name || redirectItem?.id}</span>
                    {redirectItem?.url && (
                      <a
                        href={redirectItem.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center rounded-full bg-[#F0EFFF] px-2.5 py-[2px] text-[11px] text-[#6D4AFF]"
                      >
                        <span className="mr-1">
                          <Icon name="link" size={12} />
                        </span>
                        Link
                      </a>
                    )}
                  </div>
                ) : null
              }
              hint={
                (() => {
                  const url = redirectItem?.url || null;
                  const desc = redirectItem?.description || null;
                  return (
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {desc && (
                        <span className="text-[12px] text-zinc-700">{shortText(desc, 64)}</span>
                      )}
                    </div>
                  );
                })()
              }
            />
            <StatCard
              title="Announce"
              icon="dot"
              status={appConfig?.announce?.isEnable === true}
              size="sm"
              className="border-[#6D4AFF]/15 transition hover:border-[#6D4AFF]/30 hover:bg-[#F8F7FF]"
              value={
                announceItem
                  ? (announceItem?.unit_name || announceItem?.id)
                  : null
              }
              hint={
                (() => {
                  const content = announceItem?.content || null;
                  return (
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {content && (
                        <span className="inline-flex items-center rounded-md border border-black/10 bg-zinc-50 px-2.5 py-[4px] text-[12px] text-zinc-700">
                          {shortText(content, 80)}
                        </span>
                      )}
                    </div>
                  );
                })()
              }
            />
            <StatCard
              title="Ads"
              icon="dot"
              status={appConfig?.ads?.isEnable === true}
              value={null}
              hint={
                (() => {
                  const a = appConfig?.ads || {};
                  const types = [];
                  if (a.nativeEnable) types.push("Native");
                  if (a.interstitialEnable) types.push("Interstitial");
                  if (a.bannerEnable) types.push("Banner");
                  if (a.appOpenEnable) types.push("App Open");
                  if (a.rewardEnable) types.push("Reward");
                  const iv = a.interval;
                  return (
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      {iv != null && (
                        <span className="inline-flex items-center rounded-full bg-[#F0EFFF] px-2.5 py-[2px] text-[11px] text-[#6D4AFF]">
                          <span>per {iv} klik</span>
                        </span>
                      )}
                      {types.map((t, i) => (
                        <span
                          key={`${t}-${i}`}
                          className="inline-flex items-center rounded-full border border-black/10 bg-zinc-50 px-2 py-[2px] text-[11px] text-zinc-700"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  );
                })()
              }
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard title="Series" icon="series" value={String(seriesCount)} hint="Total series" />
            <StatCard title="Tags" icon="tags" value={String(tagsCount)} hint="Total tags" />
            <StatCard title="Episodes" icon="episodes" value={String(episodesCount)} hint="Total episodes" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card title="Series Terbaru">
              <div className="mt-2 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-zinc-600">
                      <th className="px-3 py-2">Nama</th>
                      <th className="px-3 py-2">Uploaded</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(recentSeries || []).map((s) => (
                      <tr key={s.id} className="border-t border-black/5">
                        <td className="px-3 py-2 max-w-[220px] truncate text-black" title={s.name}>{s.name}</td>
                        <td className="px-3 py-2">{s.uploaded_at ? new Date(s.uploaded_at).toLocaleDateString() : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
            <Card title="Tag Teratas">
              <div className="mt-2 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-zinc-600">
                      <th className="px-3 py-2">Tag</th>
                      <th className="px-3 py-2">Penggunaan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(topTagsUsage || []).map((t, i) => (
                      <tr key={`${t.label}-${i}`} className="border-t border-black/5">
                        <td className="px-3 py-2 max-w-[220px] truncate text-black" title={t.label}>{t.label}</td>
                        <td className="px-3 py-2">{t.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
            <Card title="Episodes Terbaru">
              <div className="mt-2 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-zinc-600">
                      <th className="px-3 py-2">Series</th>
                      <th className="px-3 py-2">Episode</th>
                      <th className="px-3 py-2">Filename</th>
                      <th className="px-3 py-2">Last Modified</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(recentEpisodes || []).map((e) => (
                      <tr key={e.id} className="border-t border-black/5">
                        <td className="px-3 py-2 max-w-[220px] truncate" title={e.series?.name || seriesNameMap[e.series_id] || e.series_id}>
                          {seriesNameMap[e.series_id] || e.series?.name || e.series_id}
                        </td>
                        <td className="px-3 py-2">{e.episode_number}</td>
                        <td className="px-3 py-2 max-w-[280px] truncate" title={e.filename}>{e.filename}</td>
                        <td className="px-3 py-2">{e.last_modified ? new Date(e.last_modified).toLocaleDateString() : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card title="Orders by Status">
              <DonutChart data={ordersByStatus} totalLabel="Total Orders" />
            </Card>
            <Card title="Orders by Status (Bar)">
              <BarChart
                labels={ordersByStatus.map((d) => d.label)}
                series={[{ name: "Orders", data: ordersByStatus.map((d) => d.value), color: "#6D4AFF" }]}
              />
            </Card>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card title="Trend Revenue (IDR) 12 Bulan Terakhir">
              <BarChart
                labels={(revenueTrend || []).map((d) => d.month)}
                series={[
                  { name: "Revenue", data: (revenueTrend || []).map((d) => d.total_amount || 0), color: "#6D4AFF" },
                ]}
              />
            </Card>
            <Card title="Distribusi Orders per Provider">
              <BarChart
                labels={(ordersProviderDist || []).map((d) => d.provider)}
                series={[
                  { name: "Orders", data: (ordersProviderDist || []).map((d) => d.total || 0), color: "#6D4AFF" },
                ]}
              />
            </Card>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card title="Trend Orders per Status (12 Bulan)">
              <BarChart
                labels={(ordersStatusTrend || []).map((d) => d.month)}
                series={[
                  { name: "Paid", data: (ordersStatusTrend || []).map((d) => d.paid || 0), color: "#22C55E" },
                  { name: "Pending", data: (ordersStatusTrend || []).map((d) => d.pending || 0), color: "#F59E0B" },
                  { name: "Failed", data: (ordersStatusTrend || []).map((d) => d.failed || 0), color: "#EF4444" },
                  { name: "Expired", data: (ordersStatusTrend || []).map((d) => d.expired || 0), color: "#A1A1AA" },
                  { name: "Canceled", data: (ordersStatusTrend || []).map((d) => d.canceled || 0), color: "#6B7280" },
                ]}
              />
            </Card>
            <Card title="Trend User Baru (12 Bulan)">
              <BarChart
                labels={(newUsersTrend || []).map((d) => d.month)}
                series={[
                  { name: "User Baru", data: (newUsersTrend || []).map((d) => d.count || 0), color: "#6D4AFF" },
                ]}
              />
            </Card>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card title="Agregasi Ukuran Episodes per Bulan (12 Bulan, GB)">
              <BarChart
                labels={(episodesSizeAgg || []).map((d) => d.month)}
                series={[
                  {
                    name: "Ukuran (GB)",
                    data: (episodesSizeAgg || []).map((d) => Math.round((d.total_size || 0) / (1024 * 1024 * 1024))),
                    color: "#6D4AFF",
                  },
                ]}
              />
            </Card>
            <Card title="Top Users Berdasarkan Revenue">
              <div className="mt-2 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-zinc-600">
                      <th className="px-3 py-2">User</th>
                      <th className="px-3 py-2">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(topUsers || []).map((u, i) => (
                      <tr key={u?.user?.id || i} className="border-t border-black/5">
                        <td className="px-3 py-2 text-black">
                          {(() => {
                            const id = u?.user?.id || u?.user_id || u?.id;
                            const label =
                              u?.user?.email ||
                              u?.user?.display_name ||
                              u?.email ||
                              u?.display_name ||
                              (id ? topUserLabelMap[id] : "");
                            return label || "-";
                          })()}
                        </td>
                        <td className="px-3 py-2">{formatAmount(u?.total_amount || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
          
        </>
      )}
    </div>
  );
}
