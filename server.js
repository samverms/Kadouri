const express = require('express');
const path = require('path');
const next = require('next');

const PORT = process.env.PORT || 3000;

console.log('Starting PACE CRM Full Stack Application...');
console.log(`Port: ${PORT}`);
console.log(`Environment: ${process.env.NODE_ENV}`);

// Load API Express app (doesn't start server due to our modification)
const apiApp = require('./apps/api/dist/main.js').default;

// Initialize Next.js app
const nextApp = next({
  dev: false,
  dir: path.join(__dirname, 'apps/web')
});
const handle = nextApp.getRequestHandler();

nextApp.prepare().then(() => {
  const app = express();

  // Mount API routes first
  app.use(apiApp);

  // All other routes - handled by Next.js
  app.all('*', (req, res) => {
    return handle(req, res);
  });

  app.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${PORT}`);
    console.log(`> API routes: http://localhost:${PORT}/api/*`);
    console.log(`> Frontend: http://localhost:${PORT}/`);
  });
}).catch((ex) => {
  console.error('Error starting server:', ex.stack);
  process.exit(1);
});
