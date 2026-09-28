import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app';

describe('Phase 6 - Security and Hardening', () => {

  it('should include security headers from Helmet', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-dns-prefetch-control']).toBeDefined();
    expect(res.headers['x-frame-options']).toBeDefined();
    expect(res.headers['content-security-policy']).toBeDefined();
  });

  it('should block NoSQL injection payloads', async () => {
    // With express-mongo-sanitize, keys containing '$' or '.' in body/query/params are removed or replaced.
    const payload = { email: { $gt: "" }, password: "password123" };
    const res = await request(app).post('/api/auth/login').send(payload);
    // Depending on validation, this will fail validation (400) because email is no longer a string or the $gt is stripped.
    // As long as it doesn't cause a 500 error or bypass auth.
    expect([400, 401]).toContain(res.status);
  });

  it('should block XSS payloads', async () => {
    const payload = { email: "test@test.com", password: "<script>alert(1)</script>" };
    const res = await request(app).post('/api/auth/login').send(payload);
    // XSS clean will modify the payload or it will just fail validation
    expect([400, 401]).toContain(res.status);
  });

});
