import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import ConvertToModuleInstanceCTA from ".";
import store from "store";
import { MODULE_TYPE } from "@appsmith/constants/ModuleConstants";
import {
  CONVERT_MODULE_CTA_TEXT,
  createMessage,
} from "@appsmith/constants/messages";
import type { Package } from "@appsmith/constants/PackageConstants";
import usePackageListToConvertEntity from "./usePackageListToConvertEntity";
import { getShowQueryModule } from "@appsmith/selectors/moduleFeatureSelectors";
import "@testing-library/jest-dom";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { getCurrentAppWorkspace } from "@appsmith/selectors/workspaceSelectors";

const mockDispatch = jest.fn();
jest.mock("react-redux", () => ({
  ...jest.requireActual("react-redux"),
  useDispatch: () => mockDispatch,
}));

jest.mock("./usePackageListToConvertEntity");
jest.mock("@appsmith/selectors/workspaceSelectors");
jest.mock("@appsmith/selectors/moduleFeatureSelectors");

const packagesList = [
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
] as Package[];

const workspace = {
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
    "manage:workspaceApplications",
    "execute:workspaceEnvironments",
    "export:workspaceApplications",
    "delete:workspaceDatasources",
    "publish:workspacePackages",
    "manage:workspaceEnvironments",
    "read:workspaceApplications",
    "readHistory:workspaceWorkflows",
    "inviteUsers:workspace",
    "manage:workspaceDatasources",
    "manage:workspaceWorkflows",
    "create:datasources",
    "delete:workspaceApplications",
    "create:environments",
    "delete:workspacePackages",
    "export:workspacePackages",
    "publish:workspaceWorkflows",
    "create:applications",
    "delete:workspaceEnvironments",
  ],
  name: "Convert module wk",
  email: "ashit@appsmith.com",
};

function Wrapper({ children }: any) {
  return <Provider store={store}>{children}</Provider>;
}

describe("ConvertToModuleInstanceCTA", () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it("renders null when showQueryModule is false", () => {
    render(
      <Wrapper>
        <ConvertToModuleInstanceCTA
          canCreateModuleInstance
          canDeleteEntity
          entityId="entityId"
          moduleType={MODULE_TYPE.QUERY}
        />
      </Wrapper>,
    );

    expect(
      screen.queryByText(createMessage(CONVERT_MODULE_CTA_TEXT)),
    ).toBeNull();
  });

  it("renders button when packages.length is 0", () => {
    (usePackageListToConvertEntity as jest.Mock).mockReturnValue([]);
    (getShowQueryModule as unknown as jest.Mock).mockReturnValue(true);

    render(
      <Wrapper>
        <ConvertToModuleInstanceCTA
          canCreateModuleInstance
          canDeleteEntity
          entityId="entityId"
          moduleType={MODULE_TYPE.QUERY}
        />
      </Wrapper>,
    );

    expect(
      screen.getByText(createMessage(CONVERT_MODULE_CTA_TEXT)),
    ).toBeInTheDocument();
  });

  it("renders button on click when packages.length is 0, should call convert action with valid params", () => {
    (usePackageListToConvertEntity as jest.Mock).mockReturnValue([]);
    (getShowQueryModule as unknown as jest.Mock).mockReturnValue(true);
    (getCurrentAppWorkspace as jest.Mock).mockReturnValue(workspace);

    render(
      <Wrapper>
        <ConvertToModuleInstanceCTA
          canCreateModuleInstance
          canDeleteEntity
          entityId="entityId"
          moduleType={MODULE_TYPE.QUERY}
        />
      </Wrapper>,
    );

    const btn = screen.getByTestId("t--convert-module-btn");
    fireEvent.click(btn);

    expect(mockDispatch).toHaveBeenNthCalledWith(1, {
      type: ReduxActionTypes.CONVERT_ENTITY_TO_INSTANCE_INIT,
      payload: {
        moduleType: MODULE_TYPE.QUERY,
        publicEntityId: "entityId",
        packageId: undefined,
        initiatedFromPathname: location.pathname,
      },
    });
  });

  it("renders PackageListMenu when showQueryModule is true and packages.length > 0", async () => {
    (usePackageListToConvertEntity as jest.Mock).mockReturnValue(packagesList);
    (getShowQueryModule as unknown as jest.Mock).mockReturnValue(true);
    (getCurrentAppWorkspace as jest.Mock).mockReturnValue(workspace);

    render(
      <Wrapper>
        <ConvertToModuleInstanceCTA
          canCreateModuleInstance
          canDeleteEntity
          entityId="entityId"
          moduleType={MODULE_TYPE.QUERY}
        />
      </Wrapper>,
    );

    const btn = screen.getByTestId("t--convert-module-btn");
    fireEvent.click(btn);

    packagesList.forEach(({ name }) => {
      expect(screen.getByText(`Add to ${name}`)).toBeInTheDocument();
    });
  });
});
