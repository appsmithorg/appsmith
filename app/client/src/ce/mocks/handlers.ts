import { rest } from "msw";
import testMockApi from "./mockJsons/testMockApi.json";

export const handlers = [
  rest.get("/api/testMockApi", (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(testMockApi));
  }),
  rest.get("/api/v1/workspaces/:workspaceId", async (req, res, ctx) => {
    const { workspaceId } = await req.params;
    return res(
      ctx.status(200),
      ctx.delay(500),
      ctx.json({
        responseMeta: {
          status: 200,
          success: true,
        },
        data: {
          id: "63087c657a8d2c4004a1c359",
          userPermissions: [
            "publish:workspaceApplications",
            "delete:workspace",
            "manage:workspaceApplications",
            "delete:workspaceDatasources",
            "export:workspaceApplications",
            "read:workspaceDatasources",
            "read:workspaceApplications",
            "inviteUsers:workspace",
            "read:workspaces",
            "manage:workspaceDatasources",
            "delete:workspaceApplications",
            "create:applications",
            "manage:workspaces",
          ],
          name: "Sangeeth's Apps",
          email: "sangeeth@appsmith.com",
          plugins: [
            {
              userPermissions: [],
              pluginId: "62a57f3830ad39335c4dbf70",
              status: "FREE",
              new: true,
            },
            {
              userPermissions: [],
              pluginId: "62a57f3830ad39335c4dbf6b",
              status: "FREE",
              new: true,
            },
            {
              userPermissions: [],
              pluginId: "62a57f3a30ad39335c4dbfa7",
              status: "FREE",
              new: true,
            },
            {
              userPermissions: [],
              pluginId: "62a57f3a30ad39335c4dbfb8",
              status: "FREE",
              new: true,
            },
            {
              userPermissions: [],
              pluginId: "62a583af5f76022609968df8",
              status: "FREE",
              new: true,
            },
            {
              userPermissions: [],
              pluginId: "62a57f3930ad39335c4dbf81",
              status: "FREE",
              new: true,
            },
            {
              userPermissions: [],
              pluginId: "62a57f3630ad39335c4dbf1a",
              status: "FREE",
              new: true,
            },
            {
              userPermissions: [],
              pluginId: "62b9d071a43ddb5b61d2558c",
              status: "FREE",
              new: true,
            },
            {
              userPermissions: [],
              pluginId: "62a57f3930ad39335c4dbf78",
              status: "FREE",
              new: true,
            },
            {
              userPermissions: [],
              pluginId: "62a57f3630ad39335c4dbf19",
              status: "FREE",
              new: true,
            },
            {
              userPermissions: [],
              pluginId: "62a57f3830ad39335c4dbf6e",
              status: "FREE",
              new: true,
            },
            {
              userPermissions: [],
              pluginId: "62a57f3830ad39335c4dbf2b",
              status: "FREE",
              new: true,
            },
            {
              userPermissions: [],
              pluginId: "62a57f3930ad39335c4dbf7d",
              status: "FREE",
              new: true,
            },
            {
              userPermissions: [],
              pluginId: "62a57f3930ad39335c4dbf8e",
              status: "FREE",
              new: true,
            },
            {
              userPermissions: [],
              pluginId: "62a57f3930ad39335c4dbf9f",
              status: "FREE",
              new: true,
            },
            {
              userPermissions: [],
              pluginId: "62a57f3830ad39335c4dbf69",
              status: "FREE",
              new: true,
            },
            {
              userPermissions: [],
              pluginId: "62a57f3930ad39335c4dbf99",
              status: "FREE",
              new: true,
            },
            {
              userPermissions: [],
              pluginId: "62a57f3630ad39335c4dbf17",
              status: "FREE",
              new: true,
            },
            {
              userPermissions: [],
              pluginId: "62a57f3630ad39335c4dbf18",
              status: "FREE",
              new: true,
            },
            {
              userPermissions: [],
              pluginId: "62a583af5f76022609968df8",
              status: "ACTIVATED",
              new: true,
            },
            {
              userPermissions: [],
              pluginId: "62b9d071a43ddb5b61d2558c",
              status: "ACTIVATED",
              new: true,
            },
          ],
          slug: "sangeeth-s-apps",
          tenantId: "62a57f3c30ad39335c4dbffe",
          logoUrl: "/api/v1/assets/null",
          new: false,
        },
      }),
    );
  }),
];
