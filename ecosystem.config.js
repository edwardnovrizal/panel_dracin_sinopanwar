module.exports = {
  apps: [
    {
      name: "panel_admin",
      script: "node_modules/.bin/next",
      args: "start -p 3002",
      env: {
        BASE_URL: process.env.BASE_URL || "http://localhost:3002",
      },
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      exec_mode: "fork",
      instances: 1,
    },
  ],
};
