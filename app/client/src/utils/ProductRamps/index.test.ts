import store from "store";
import {
  PRODUCT_RAMPS_LIST,
  getUserRoleInWorkspace,
  showProductRamps,
} from ".";
import { RAMP_FOR_ROLES, RAMP_NAME } from "./RampsControlList";
import type { SupportedRampsType } from "./RampTypes";

jest.mock("store");

describe("getUserRoleInWorkspace", () => {
  test("should return Super User role when isSuperUser is true", () => {
    const stateMock = {
      ui: {
        users: {
          currentUser: {
            isSuperUser: true,
          },
        },
      },
    };
    (store.getState as jest.Mock).mockReturnValue(stateMock);

    const result = getUserRoleInWorkspace();
    expect(result).toBe(RAMP_FOR_ROLES.SUPER_USER);
  });

  test("should return the role when isSuperUser is false and workspaceUsers has roles", () => {
    const roles = ["Administrator", "Developer", "App Viewer"];

    roles.forEach((role) => {
      const stateMock = {
        ui: {
          users: {
            currentUser: {
              isSuperUser: false,
              username: "testuser",
            },
          },
          workspaces: {
            workspaceUsers: [
              {
                username: "testuser",
                roles: [
                  {
                    name: `${role}-role`,
                  },
                ],
              },
            ],
          },
        },
      };
      (store.getState as jest.Mock).mockReturnValue(stateMock);

      const result = getUserRoleInWorkspace();
      expect(result).toBe(role);
    });
  });
});

describe("showProductRamps", () => {
  test("should return false when rampName is not in PRODUCT_RAMPS_LIST", () => {
    const stateMock = {
      ui: {
        users: {
          currentUser: {
            isSuperUser: true,
          },
        },
      },
    };
    (store.getState as jest.Mock).mockReturnValue(stateMock);
    const rampName = "INVALID_RAMP";
    const result = showProductRamps(rampName);
    expect(result).toBe(false);
  });

  test("should return the correct rampConfig based on role and env", () => {
    const rampNames = [RAMP_NAME.INVITE_USER_TO_APP, RAMP_NAME.CUSTOM_ROLES];
    const envs = ["SELF_HOSTED", "CLOUD_HOSTED"];
    const roles = ["Administrator", "Developer", "App Viewer"];
    rampNames.forEach((ramp) => {
      envs.forEach((env) => {
        roles.forEach((role) => {
          (store.getState as jest.Mock).mockReturnValueOnce({
            ui: {
              users: {
                currentUser: {
                  isSuperUser: false,
                  username: "testuser",
                },
              },
              workspaces: {
                workspaceUsers: [
                  {
                    username: "testuser",
                    roles: [
                      {
                        name: `${role}-role`,
                      },
                    ],
                  },
                ],
              },
            },
          });
          const result = showProductRamps(ramp);
          const expected =
            PRODUCT_RAMPS_LIST[ramp][env as keyof SupportedRampsType][role];
          expect(result).toBe(expected);
        });
      });
    });
  });
});
