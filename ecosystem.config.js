module.exports = {
  apps: [
    {
      name: "panel-dracin-sinopanwar",
      script: "node_modules/.bin/next",
      args: "start -p 3002",
      env: {
        BASE_URL: process.env.BASE_URL,
        ADMIN_API_BASE: process.env.ADMIN_API_BASE,
      },
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      exec_mode: "fork",
      instances: 1,
    },
  ],
};
