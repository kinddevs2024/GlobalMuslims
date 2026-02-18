module.exports = {
  apps: [
    {
      name: 'globalmuslims-bot',
      script: 'src/server.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 3002,
        BOT_MODE: 'polling'
      }
    }
  ]
};
