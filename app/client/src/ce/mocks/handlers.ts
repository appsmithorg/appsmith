import { rest } from "msw";

export const handlers = [
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
          id: workspaceId,
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
            "delete:datasources",
            "create:actions",
            "manage:actions",
            "delete:actions",
            "create:pages",
          ],
          name: "Sangeeth's Apps",
          email: "sangeeth@appsmith.com",
          slug: "sangeeth-s-apps",
          tenantId: "62a57f3c30ad39335c4dbffe",
          logoUrl: "/api/v1/assets/null",
          new: false,
        },
      }),
    );
  }),
];
