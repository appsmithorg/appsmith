import { rest } from "msw";
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
];
