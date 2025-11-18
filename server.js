// Simple server that runs both API and Next.js
const { spawn } = require('child_process');
const path = require('path');

const PORT = process.env.PORT || 3000;
const API_PORT = parseInt(PORT) + 1;

console.log('Starting PACE CRM...');
console.log(`Frontend will run on port ${PORT}`);
console.log(`API will run on port ${API_PORT}`);

// Start API on different port
const api = spawn('node', ['apps/api/dist/main.js'], {
  env: { ...process.env, PORT: API_PORT },
  stdio: ['inherit', 'pipe', 'pipe']
});

api.stdout.on('data', (data) => console.log(`API: ${data}`));
api.stderr.on('data', (data) => console.error(`API: ${data}`));

// Wait for API to start, then start Next.js
setTimeout(() => {
  const web = spawn('npm', ['start'], {
    cwd: path.join(__dirname, 'apps/web'),
    env: {
      ...process.env,
      PORT: PORT,
      NEXT_PUBLIC_API_URL: `http://localhost:${API_PORT}`
    },
    stdio: 'inherit'
  });

  web.on('error', (err) => {
    console.error('Failed to start frontend:', err);
    process.exit(1);
  });
}, 3000);

process.on('SIGTERM', () => {
  console.log('Shutting down...');
  api.kill();
  process.exit(0);
});
