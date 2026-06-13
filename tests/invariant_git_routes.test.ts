import express from "express";
import request from "supertest";

// Import the actual router from the production file
import router from "../src/routes/git_routes";

const app = express();
app.use(express.json());
app.use("/api/v1/git", router);

describe("Protected endpoints reject unauthenticated requests", () => {
  const payloads = [
    { description: "no auth header", headers: {} },
    { description: "malformed token", headers: { Authorization: "Bearer malformed.token.value" } },
    { description: "empty bearer token", headers: { Authorization: "Bearer " } },
    { description: "invalid scheme", headers: { Authorization: "Basic dXNlcjpwYXNz" } },
  ];

  test.each(payloads)(
    "POST /reset rejects request with $description",
    async ({ headers }) => {
      const res = await request(app)
        .post("/api/v1/git/reset")
        .set(headers)
        .send({ repoUrl: "https://github.com/attacker/repo.git", branchName: "main" });

      expect([401, 403]).toContain(res.status);
    }
  );
});