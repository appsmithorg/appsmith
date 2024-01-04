import React from "react";
import { renderHook } from "@testing-library/react-hooks";
import { Provider } from "react-redux";
import usePackageListToConvertEntity from "./usePackageListToConvertEntity"; // Adjust the path accordingly
import store from "store";
import type { Package } from "@appsmith/constants/PackageConstants";
import { getPackagesList } from "@appsmith/selectors/packageSelectors";
import { getCurrentAppWorkspace } from "@appsmith/selectors/workspaceSelectors";
import {
  CANNOT_CREATE_MODULE_WARN,
  CONVERT_ENTITY_UNPUBLISHED_CHANGES_WARN,
  createMessage,
} from "@appsmith/constants/messages";

jest.mock("@appsmith/selectors/packageSelectors");
jest.mock("@appsmith/selectors/workspaceSelectors");

const packagesList = [
  {
    id: "658533f36fc4eb7132d31829",
    name: "Untitled Package 1",
    workspaceId: "658533ee6fc4eb7132d31821",
    userPermissions: [
      "manage:packages",
      "publish:packages",
      "export:packages",
      "read:packages",
      "create:modules",
      "delete:packages",
    ],
    modifiedAt: "2023-12-22T07:02:43.938Z",
    modifiedBy: "ashit@appsmith.com",
    lastPublishedAt: "2023-12-22T07:02:43.937Z",
  },
  {
    id: "6583f9b4289915064d57c2fb",
    name: "Untitled Package 2",
    workspaceId: "6582bd6d17e1f46ed61c4f10",
    userPermissions: [
      "manage:packages",
      "publish:packages",
      "export:packages",
      "read:packages",
      "create:modules",
      "delete:packages",
    ],
    modifiedAt: "2023-12-21T08:39:16.384Z",
    modifiedBy: "ashit@appsmith.com",
    lastPublishedAt: "2023-12-21T08:39:16.385Z",
  },
  {
    id: "65896b01f277602fb8cb17bf",
    name: "Untitled Package 3",
    workspaceId: "6582bd6d17e1f46ed61c4f10",
    userPermissions: [
      "manage:packages",
      "publish:packages",
      "export:packages",
      "read:packages",
      "delete:packages",
    ],
    modifiedAt: "2023-12-25T11:45:40.441Z",
    modifiedBy: "ashit@appsmith.com",
    lastPublishedAt: "2023-12-25T11:45:40.441Z",
  },
  {
    id: "658972c2f277602fb8cb17ed",
    name: "Untitled Package 4",
    workspaceId: "6582bd6d17e1f46ed61c4f10",
    userPermissions: [
      "manage:packages",
      "publish:packages",
      "export:packages",
      "read:packages",
      "create:modules",
      "delete:packages",
    ],
    modifiedAt: "2023-12-21T11:45:40.442Z",
    modifiedBy: "ashit@appsmith.com",
    lastPublishedAt: "2023-12-21T11:45:40.441Z",
  },
  {
    id: "658972c2f277602fb8cb17qw",
    name: "Untitled Package 5",
    workspaceId: "6582bd6d17e1f46ed61c4f10",
    userPermissions: [
      "manage:packages",
      "publish:packages",
      "export:packages",
      "read:packages",
      "delete:packages",
    ],
    modifiedAt: "2023-12-25T12:17:06.857Z",
    modifiedBy: "ashit@appsmith.com",
    lastPublishedAt: "2023-12-21T11:45:40.441Z",
  },
  {
    id: "65851ff2c21b6a18bb611c14",
    name: "Untitled Package 6",
    workspaceId: "65818942d5a23438a3a34c3f",
    customJSLibs: [],
    userPermissions: [
      "manage:packages",
      "publish:packages",
      "export:packages",
      "read:packages",
      "create:modules",
      "delete:packages",
    ],
    modifiedAt: "2023-12-22T05:34:42.050Z",
    modifiedBy: "ashit@appsmith.com",
    lastPublishedAt: "2023-12-25T11:45:40.441Z",
  },
] as Package[];

describe("usePackageListToConvertEntity", () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );

  it("should filter and transform packages correctly", () => {
    const currentWorkspace = {
      id: "6582bd6d17e1f46ed61c4f10",
    };

    const expectedOutput = [
      {
        // Positive test case
        ...packagesList[1],
        disabledTooltipText: undefined,
        isDisabled: false,
      },
      {
        // Create module permission is missing
        ...packagesList[2],
        disabledTooltipText: createMessage(CANNOT_CREATE_MODULE_WARN),
        isDisabled: true,
      },
      {
        // Create module permission is available but lastModified does not match with lastPublished
        ...packagesList[3],
        disabledTooltipText: createMessage(
          CONVERT_ENTITY_UNPUBLISHED_CHANGES_WARN,
        ),
        isDisabled: true,
      },
      {
        // Both create permission and lastPublished are incorrect/missing.
        ...packagesList[4],
        disabledTooltipText: createMessage(CANNOT_CREATE_MODULE_WARN),
        isDisabled: true,
      },
    ];

    (getPackagesList as jest.Mock).mockReturnValue(packagesList);
    (getCurrentAppWorkspace as jest.Mock).mockReturnValue(currentWorkspace);

    const { result } = renderHook(() => usePackageListToConvertEntity(), {
      wrapper,
    });

    expect(result.current).toEqual(expectedOutput);
  });
});
