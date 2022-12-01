import { rest } from "msw";
import {
  addCommentToThreadMockResponse,
  fetchApplicationThreadsMockResponse,
  createNewThreadMockResponse,
} from "mockResponses/CommentApiMockResponse";
import CreateWorkspaceMockResponse from "mockResponses/CreateWorkspaceMockResponse.json";
import ApplicationsNewMockResponse from "mockResponses/ApplicationsNewMockResponse.json";

const mockSuccessRes = {
  responseMeta: { status: 200, success: true },
  data: {},
};

export const handlers = [
  // mock apis here
  rest.post("/api/v1/workspaces", (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(CreateWorkspaceMockResponse));
  }),
  rest.get("/api/v1/applications/new", (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(ApplicationsNewMockResponse));
  }),
  // comment thread api
  // fetch application threads, accept query { applicationId }
  rest.get("/api/v1/comments/threads", (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(fetchApplicationThreadsMockResponse));
  }),
  // create new thread
  rest.post("/api/v1/comments/threads", (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(createNewThreadMockResponse));
  }),
  // add comment to thread
  rest.post("/api/v1/comments", (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(addCommentToThreadMockResponse));
  }),
  rest.put(/.*/, (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(mockSuccessRes));
  }),
  rest.post(/.*/, (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(mockSuccessRes));
  }),
  rest.get(/.*/, (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(mockSuccessRes));
  }),
  rest.patch(/.*/, (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(mockSuccessRes));
  }),
  rest.delete(/.*/, (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(mockSuccessRes));
  }),
];
