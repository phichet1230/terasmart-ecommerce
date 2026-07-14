const { exec } = require('child_process');

function startTunnel() {
  console.log('Starting localtunnel...');
  const proc = exec('npx -y localtunnel --port 5000 --subdomain terasmartecom-dashboard');
  
  proc.stdout.on('data', (data) => {
    console.log(data.toString());
  });
  
  proc.stderr.on('data', (data) => {
    console.error(data.toString());
  });
  
  proc.on('close', (code) => {
    console.log(`localtunnel process exited with code ${code}. Restarting in 5s...`);
    setTimeout(startTunnel, 5000);
  });
}

startTunnel();
