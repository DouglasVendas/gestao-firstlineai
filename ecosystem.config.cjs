module.exports = {
  apps: [
    {
      name: "gestao-firstlineai",
      cwd: "/var/www/gestao-firstlineai",
      script: "npx",
      args: "serve -s dist -l 8080",
      env: {
        NODE_ENV: "production",
      },
      autorestart: true,
      max_restarts: 10,
      watch: false,
    },
  ],
};
