try {
  require.resolve('mysql2/promise');
} catch {
  console.log('[startup] mysql2 missing — installing...');
  require('child_process').execSync('npm install mysql2@^3.23.2 --omit=dev', {
    stdio: 'inherit',
    cwd: require('path').join(__dirname, '..'),
  });
}
