const http = require('http');

const BASE_URL = 'http://127.0.0.1:5001';
const tests = [];

function request(pathname, validator) {
  return new Promise((resolve) => {
    http.get(`${BASE_URL}${pathname}`, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        const pass = validator(res, data);
        tests.push({
          name: pathname,
          status: pass ? 'PASS' : 'FAIL',
          code: res.statusCode
        });
        resolve();
      });
    }).on('error', () => {
      tests.push({
        name: pathname,
        status: 'FAIL',
        code: 'ECONNREFUSED'
      });
      resolve();
    });
  });
}

async function run() {
  console.log('Running GrandStay smoke tests...\n');

  await Promise.all([
    request('/', (res, body) => res.statusCode === 200 && body.includes('GrandStay') && body.includes('spa-services') && body.includes('dining') && body.includes('href="/login"') && body.includes('href="/admin"')),
    request('/login', (res, body) => res.statusCode === 200 && body.includes('GrandStay Member Access') && body.includes('memberLoginForm') && body.includes('memberRegisterForm')),
    request('/admin', (res, body) => res.statusCode === 200 && body.includes('GrandStay Admin Access') && body.includes('adminLoginForm')),
    request('/admin/dashboard', (res, body) => res.statusCode === 200 && body.includes('GrandStay Admin Access') && body.includes('Daily service overview')),
    request('/styles/main.css', (res) => res.statusCode === 200),
    request('/styles/auth-portal.css', (res) => res.statusCode === 200),
    request('/styles/admin.css', (res) => res.statusCode === 200),
    request('/scripts/app.js', (res) => res.statusCode === 200),
    request('/scripts/site-auth.js', (res) => res.statusCode === 200),
    request('/scripts/site-admin.js', (res) => res.statusCode === 200),
    request('/api/health', (res, body) => res.statusCode === 200 && body.includes('GrandStay Hotel backend is running')),
    request('/api/rooms?checkIn=2026-03-22&checkOut=2026-03-24', (res, body) => res.statusCode === 200 && body.includes('availableRooms')),
    request('/api/spa/services', (res, body) => res.statusCode === 200 && body.includes('serviceList')),
    request('/api/spa/availability?date=2026-03-22', (res, body) => res.statusCode === 200 && body.includes('nextAvailable')),
    request('/api/food/menu', (res, body) => res.statusCode === 200 && body.includes('serviceHours'))
  ]);

  const allPass = tests.every((test) => test.status === 'PASS');

  tests.forEach((test) => {
    console.log(`${test.status.padEnd(4)} ${test.name.padEnd(42)} [${test.code}]`);
  });

  console.log(`\nOverall: ${allPass ? 'PASS' : 'FAIL'}`);
  process.exit(allPass ? 0 : 1);
}

run();
