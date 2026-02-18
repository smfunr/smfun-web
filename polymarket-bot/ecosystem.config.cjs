module.exports = {
  apps: [
    {
      name: 'polymarket-auto',
      script: 'auto_bot.py',
      interpreter: 'python3',
      cwd: __dirname,
      env: {
        PYTHONUNBUFFERED: '1',
      },
      autorestart: true,
      max_restarts: 20,
      min_uptime: '10s',
      restart_delay: 3000,
      out_file: './logs/pm2-out.log',
      error_file: './logs/pm2-err.log',
      merge_logs: true,
      time: true,
    },
  ],
};
