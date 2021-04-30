import { rest } from "msw";
import {
  addCommentToThreadMockResponse,
  fetchApplicationThreadsMockResponse,
  createNewThreadMockResponse,
} from "mockResponses/CommentApiMockResponse";
import CreateOrganisationMockResponse from "mockResponses/CreateOrganisationMockResponse.json";
import ApplicationsNewMockResponse from "mockResponses/ApplicationsNewMockResponse.json";

export const handlers = [
  // mock apis here
  rest.post("/api/v1/organizations", (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(CreateOrganisationMockResponse));
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
];
