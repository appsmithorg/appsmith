import { renderHook } from "@testing-library/react-hooks";
import React from "react";
import { Provider } from "react-redux";
import store from "store";
import "@testing-library/jest-dom";
import { getPackagesList } from "@appsmith/selectors/packageSelectors";
import { useConvertToModuleOptions } from "./hooks";
import { MODULE_TYPE } from "@appsmith/constants/ModuleConstants";
import type { Package } from "@appsmith/constants/PackageConstants";
import { getCurrentAppWorkspace } from "@appsmith/selectors/workspaceSelectors";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { getPagePermissions } from "selectors/editorSelectors";
import { getIsActionConverting } from "@appsmith/selectors/entitiesSelector";
import type { TreeDropdownOption } from "pages/Editor/Explorer/ContextMenu";
import { noop } from "lodash";
import {
  CANNOT_CREATE_MODULE_WARN,
  CONVERT_ENTITY_UNPUBLISHED_CHANGES_WARN,
  CONVERT_MODULE_CTA_TEXT,
  createMessage,
} from "@appsmith/constants/messages";

jest.mock("@appsmith/selectors/packageSelectors");
jest.mock("@appsmith/selectors/workspaceSelectors");
jest.mock("utils/hooks/useFeatureFlag");
jest.mock("selectors/editorSelectors");
jest.mock("@appsmith/selectors/entitiesSelector");

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
    lastPublishedAt: "2023-12-21T08:39:16.384Z",
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
    modifiedAt: "2023-12-25T12:17:06.857Z",
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

const currentWorkspace = {
  id: "6582bd6d17e1f46ed61c4f10",
  userPermissions: [
    "publish:workspaceApplications",
    "delete:workspace",
    "read:workspaceDatasources",
    "read:workspaceEnvironments",
    "read:workspacePackages",
    "manage:workspacePackages",
    "read:workspaces",
    "makePublic:workspaceApplications",
    "create:workflows",
    "create:packages",
    "execute:workspaceDatasources",
    "manage:workspaces",
    "delete:workspaceWorkflows",
    "export:workspaceWorkflows",
    "execute:workspaceEnvironments",
    "manage:workspaceApplications",
    "export:workspaceApplications",
    "publish:workspacePackages",
    "delete:workspaceDatasources",
    "manage:workspaceEnvironments",
    "readHistory:workspaceWorkflows",
    "read:workspaceApplications",
    "inviteUsers:workspace",
    "manage:workspaceWorkflows",
    "manage:workspaceDatasources",
    "create:datasources",
    "delete:workspaceApplications",
    "create:environments",
    "delete:workspacePackages",
    "export:workspacePackages",
    "delete:workspaceEnvironments",
    "create:applications",
    "publish:workspaceWorkflows",
  ],
  name: "Test workspace",
  email: "user@appsmith.com",
  slug: "test-work",
  tenantId: "644b84e080127e0eff78a746",
  logoUrl: "/api/v1/assets/null",
  new: false,
};

const pagePermissions = [
  "create:moduleInstancesInPage",
  "read:pages",
  "manage:pages",
  "create:pageActions",
  "delete:pages",
];

describe("#useConvertToModuleOptions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return the correct TreeDropdownOption for positive condition", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );

    (getPackagesList as jest.Mock).mockReturnValue(packagesList);
    (getCurrentAppWorkspace as jest.Mock).mockReturnValue(currentWorkspace);
    (useFeatureFlag as jest.Mock).mockReturnValue(true);
    (getPagePermissions as jest.Mock).mockReturnValue(pagePermissions);
    (getIsActionConverting as jest.Mock).mockReturnValue(false);

    const expectedOutput: TreeDropdownOption = {
      value: "",
      onSelect: expect.any(Function),
      label: createMessage(CONVERT_MODULE_CTA_TEXT),
      disabled: false,

      children: [
        {
          label: `Add to ${packagesList[1].name}`,
          value: packagesList[1].id,
          onSelect: expect.any(Function),
          disabled: false,
          tooltipText: undefined,
        },
        {
          label: `Add to ${packagesList[2].name}`,
          value: packagesList[2].id,
          onSelect: noop,
          disabled: true,
          tooltipText: createMessage(CANNOT_CREATE_MODULE_WARN),
        },
        {
          label: `Add to ${packagesList[3].name}`,
          value: packagesList[3].id,
          onSelect: noop,
          disabled: true,
          tooltipText: createMessage(CONVERT_ENTITY_UNPUBLISHED_CHANGES_WARN),
        },
        {
          label: `Add to ${packagesList[4].name}`,
          value: packagesList[4].id,
          onSelect: noop,
          disabled: true,
          tooltipText: createMessage(CANNOT_CREATE_MODULE_WARN),
        },
        {
          label: "divider",
          onSelect: noop,
          type: "menu-divider",
          value: "divider",
        },
        {
          value: "",
          onSelect: expect.any(Function),
          label: "Add to a new package",
          disabled: false,
        },
      ],
    };

    const { result } = renderHook(
      () =>
        useConvertToModuleOptions({
          id: "test-entity-id",
          moduleType: MODULE_TYPE.QUERY,
          canDelete: true,
        }),
      {
        wrapper,
      },
    );

    expect(result.current).toEqual(expectedOutput);
  });

  it("should return without any children when packageList is empty", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );

    (getPackagesList as jest.Mock).mockReturnValue([]);
    (getCurrentAppWorkspace as jest.Mock).mockReturnValue(currentWorkspace);
    (useFeatureFlag as jest.Mock).mockReturnValue(true);
    (getPagePermissions as jest.Mock).mockReturnValue(pagePermissions);
    (getIsActionConverting as jest.Mock).mockReturnValue(false);

    const expectedOutput: TreeDropdownOption = {
      value: "",
      onSelect: expect.any(Function),
      label: createMessage(CONVERT_MODULE_CTA_TEXT),
      disabled: false,
    };

    const { result } = renderHook(
      () =>
        useConvertToModuleOptions({
          id: "test-entity-id",
          moduleType: MODULE_TYPE.QUERY,
          canDelete: true,
        }),
      {
        wrapper,
      },
    );

    expect(result.current).toEqual(expectedOutput);
  });

  it("should return main option disabled when the action is converting", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );

    (getPackagesList as jest.Mock).mockReturnValue(packagesList);
    (getCurrentAppWorkspace as jest.Mock).mockReturnValue(currentWorkspace);
    (useFeatureFlag as jest.Mock).mockReturnValue(true);
    (getPagePermissions as jest.Mock).mockReturnValue(pagePermissions);
    (getIsActionConverting as jest.Mock).mockReturnValue(true);

    const expectedOutput: TreeDropdownOption = {
      value: "",
      onSelect: noop,
      label: createMessage(CONVERT_MODULE_CTA_TEXT),
      disabled: true,

      children: [
        {
          label: `Add to ${packagesList[1].name}`,
          value: packagesList[1].id,
          onSelect: expect.any(Function),
          disabled: false,
          tooltipText: undefined,
        },
        {
          label: `Add to ${packagesList[2].name}`,
          value: packagesList[2].id,
          onSelect: noop,
          disabled: true,
          tooltipText: createMessage(CANNOT_CREATE_MODULE_WARN),
        },
        {
          label: `Add to ${packagesList[3].name}`,
          value: packagesList[3].id,
          onSelect: noop,
          disabled: true,
          tooltipText: createMessage(CONVERT_ENTITY_UNPUBLISHED_CHANGES_WARN),
        },
        {
          label: `Add to ${packagesList[4].name}`,
          value: packagesList[4].id,
          onSelect: noop,
          disabled: true,
          tooltipText: createMessage(CANNOT_CREATE_MODULE_WARN),
        },
        {
          label: "divider",
          onSelect: noop,
          type: "menu-divider",
          value: "divider",
        },
        {
          value: "",
          onSelect: expect.any(Function),
          label: "Add to a new package",
          disabled: false,
        },
      ],
    };

    const { result } = renderHook(
      () =>
        useConvertToModuleOptions({
          id: "test-entity-id",
          moduleType: MODULE_TYPE.QUERY,
          canDelete: true,
        }),
      {
        wrapper,
      },
    );

    expect(result.current).toEqual(expectedOutput);
  });
});
