import app from "../ce/server";
import { RTS_BASE_API_PATH } from "@constants/routes";
import supertest from "supertest";

afterAll(async () => {
  await new Promise((resolve) => app.close(resolve));
});

describe("RTS route surface (GHSA-j5m9-g52c-9p9w)", () => {
  // Express answers OPTIONS from its route table without calling a route
  // handler, so this checks route registration only.
  it("does not expose git maintenance routes", async () => {
    await supertest(app).options(`${RTS_BASE_API_PATH}/git/reset`).expect(404);
  });

  it("keeps the health check available", async () => {
    await supertest(app)
      .get(`${RTS_BASE_API_PATH}/health-check`)
      .expect(200)
      .then((response) => {
        expect(response.body.success).toEqual(true);
      });
  });
});
