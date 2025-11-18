const { spawn } = require('child_process');
const path = require('path');

const PORT = process.env.PORT || 3000;

console.log('Starting PACE CRM on Heroku...');
console.log(`Port: ${PORT}`);

// Start Next.js on the Heroku port
const nextServer = spawn('node', ['apps/web/.next/standalone/apps/web/server.js'], {
  env: {
    ...process.env,
    PORT: PORT,
    HOSTNAME: '0.0.0.0'
  },
  stdio: 'inherit'
});

nextServer.on('error', (err) => {
  console.error('Failed to start Next.js server:', err);
  process.exit(1);
});

nextServer.on('exit', (code) => {
  console.log(`Next.js server exited with code ${code}`);
  process.exit(code || 0);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  nextServer.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully...');
  nextServer.kill('SIGINT');
});
