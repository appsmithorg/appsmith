import request from 'supertest';
import express from 'express';
import gitRoutes from '../../../src/routes/git_routes';

describe('Protected endpoints reject unauthenticated requests', () => {
  let app: express.Application;
  let originalSecret: string | undefined;

  beforeAll(() => {
    originalSecret = process.env.APPSMITH_RTS_SECRET;
    process.env.APPSMITH_RTS_SECRET = 'test-secret';
    app = express();
    app.use(express.json());
    app.use('/git', gitRoutes);
  });

  afterAll(() => {
    if (originalSecret === undefined) {
      delete process.env.APPSMITH_RTS_SECRET;
    } else {
      process.env.APPSMITH_RTS_SECRET = originalSecret;
    }
  });

  const payloads = [
    { name: 'missing_auth_header', headers: {}, expectedStatus: 401 },
    { name: 'invalid_token', headers: { 'x-rts-secret': 'invalid_token_xyz' }, expectedStatus: 401 },
    { name: 'expired_token', headers: { 'x-rts-secret': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2MDAwMDAwMDB9.invalid' }, expectedStatus: 401 },
    { name: 'malformed_auth', headers: { 'x-rts-secret': 'InvalidScheme token123' }, expectedStatus: 401 },
    { name: 'empty_token', headers: { 'x-rts-secret': '' }, expectedStatus: 401 },
  ];

  test.each(payloads)(
    'POST /reset rejects unauthenticated request: $name',
    async ({ headers, expectedStatus }) => {
      const response = await request(app)
        .post('/git/reset')
        .set(headers)
        .send({ repoPath: 'test-repo' });

      expect(response.status).toBe(expectedStatus);
    }
  );
});
