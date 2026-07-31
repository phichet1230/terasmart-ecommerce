const { exec } = require('child_process');

const DOMAIN = 'juiciness-revert-epilogue.ngrok-free.dev';

function startNgrok() {
  console.log(`🚀 Connecting Ngrok Static Domain: https://${DOMAIN} -> http://localhost:5000...`);
  const proc = exec(`npx ngrok http 5000 --url=${DOMAIN}`);

  proc.stdout.on('data', (data) => {
    console.log(`[Ngrok] ${data.toString().trim()}`);
  });

  proc.stderr.on('data', (data) => {
    console.error(`[Ngrok] ${data.toString().trim()}`);
  });

  proc.on('close', (code) => {
    console.log(`[Ngrok] Process exited with code ${code}. Reconnecting in 3s...`);
    setTimeout(startNgrok, 3000);
  });
}

startNgrok();
