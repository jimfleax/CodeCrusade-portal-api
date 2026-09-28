import request from 'supertest';
import app from './src/app';

async function run() {
  const payload = { email: { $gt: "" }, password: "password123" };
  const res = await request(app).post('/api/auth/login').send(payload);
  console.log('NoSQL response status:', res.status);
  
  const payload2 = { email: "test@test.com", password: "<script>alert(1)</script>" };
  const res2 = await request(app).post('/api/auth/login').send(payload2);
  console.log('XSS response status:', res2.status);
  process.exit(0);
}
run();
