import { spawn } from 'node:child_process';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForHealth(baseUrl, timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${baseUrl}/health`);
      if (res.ok) return;
    } catch {
      // keep polling
    }
    await sleep(500);
  }
  throw new Error('Server did not become healthy in time');
}

async function run() {
  const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';
  const server = spawn('node', ['dist/server.js'], {
    stdio: 'pipe',
    env: {
      ...process.env,
      NODE_ENV: 'test',
    },
  });

  server.stdout.on('data', (chunk) => process.stdout.write(chunk));
  server.stderr.on('data', (chunk) => process.stderr.write(chunk));

  try {
    await waitForHealth(baseUrl);

    const email = `smoke.${Date.now()}@example.com`;
    const password = 'Password123';

    const registerRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Smoke',
        lastName: 'Tester',
        email,
        password,
        preferredShift: 'morning',
      }),
    });
    if (!registerRes.ok) throw new Error(`Register failed: ${registerRes.status}`);
    const registerJson = await registerRes.json();
    const token = registerJson?.data?.token;
    if (!token) throw new Error('Missing token after register');

    const unauthorizedRes = await fetch(`${baseUrl}/api/contacts`);
    if (unauthorizedRes.status !== 401) {
      throw new Error(`Expected 401 without token, got ${unauthorizedRes.status}`);
    }

    const createContactRes = await fetch(`${baseUrl}/api/contacts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: 'Ops Lead', email: 'ops.lead@example.com', role: 'to' }),
    });
    if (createContactRes.status !== 201) {
      throw new Error(`Create contact failed: ${createContactRes.status}`);
    }

    const createTaskRes = await fetch(`${baseUrl}/api/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: 'Smoke Test Task',
        status: 'in_progress',
        type: 'dynamic',
        time: '10:30',
      }),
    });
    if (createTaskRes.status !== 201) {
      throw new Error(`Create task failed: ${createTaskRes.status}`);
    }

    const reportRes = await fetch(`${baseUrl}/api/reports/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ userName: 'Smoke Tester', shift: 'morning' }),
    });
    if (!reportRes.ok) throw new Error(`Report generation failed: ${reportRes.status}`);

    console.log('Smoke test passed.');
  } finally {
    server.kill();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
