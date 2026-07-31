const { spawn } = require('child_process');

console.log('🚀 Starting both Server and Serveo Tunnel in parallel...\n');

// 1. Start Server with nodemon (Auto-Reload)
const server = spawn('npx', ['nodemon', 'server.js'], { shell: true });
server.stdout.on('data', (data) => {
  process.stdout.write(`[Server] ${data}`);
});
server.stderr.on('data', (data) => {
  process.stderr.write(`[Server ERROR] ${data}`);
});

// 2. Start Tunnel
const tunnel = spawn('node', ['scratch/tunnel.js'], { shell: true });
tunnel.stdout.on('data', (data) => {
  process.stdout.write(`[Tunnel] ${data}`);
});
tunnel.stderr.on('data', (data) => {
  process.stderr.write(`[Tunnel ERROR] ${data}`);
});

// Handle termination cleanly
process.on('SIGINT', () => {
  console.log('\nStopping Server and Tunnel...');
  server.kill();
  tunnel.kill();
  process.exit();
});
