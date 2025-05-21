import { spawn } from 'child_process';

// This script helps run the Vite development server for Preview
const viteProcess = spawn('npx', ['vite', '--host', '0.0.0.0', '--port', '5000'], {
  stdio: 'inherit',
  shell: true
});

viteProcess.on('error', (err) => {
  console.error('Failed to start Vite server:', err);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  viteProcess.kill();
  process.exit(0);
});

console.log('Great Cookie Hunt game development server started on port 5000');