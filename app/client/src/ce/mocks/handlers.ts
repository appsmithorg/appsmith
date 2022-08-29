import { rest } from "msw";
import testMockApi from "./mockJsons/testMockApi.json";

export const handlers = [
  rest.get("/api/testMockApi", (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(testMockApi));
  }),
];
