import request from 'supertest';
import express from 'express';
import gitRoutes from '../../../src/routes/git_routes';

describe('Protected endpoints reject unauthenticated requests', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/git', gitRoutes);
  });

  const payloads = [
    { name: 'missing_auth_header', headers: {}, expectedStatus: 401 },
    { name: 'invalid_token', headers: { authorization: 'Bearer invalid_token_xyz' }, expectedStatus: 401 },
    { name: 'expired_token', headers: { authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2MDAwMDAwMDB9.invalid' }, expectedStatus: 401 },
    { name: 'malformed_auth', headers: { authorization: 'InvalidScheme token123' }, expectedStatus: 401 },
    { name: 'empty_token', headers: { authorization: 'Bearer ' }, expectedStatus: 401 },
  ];

  test.each(payloads)(
    'POST /reset rejects unauthenticated request: $name',
    async ({ headers, expectedStatus }) => {
      const response = await request(app)
        .post('/git/reset')
        .set(headers)
        .send({ repositoryId: 'test-repo' });

      expect([401, 403]).toContain(response.status);
    }
  );
});