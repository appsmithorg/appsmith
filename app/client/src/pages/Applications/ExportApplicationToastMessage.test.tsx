import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import ApplicationCard from "./ApplicationCard";
import {
  getIsErroredSavingAppName,
  getIsSavingAppName,
} from "@appsmith/selectors/applicationSelectors";
import { getIsGitConnected } from "../../selectors/gitSyncSelectors";
import { isEditOnlyModeSelector } from "../../selectors/editorSelectors";
import { ThemeProvider } from "styled-components";
import { toast } from "design-system";

jest.mock("design-system", () => ({
  ...jest.requireActual("design-system"),
  toast: {
    show: jest.fn(),
  },
}));

const mockStore = configureStore([]);

const store = mockStore({
  applicationName: "My first application",
  ui: {
    workspaces: {
      list: [
        {
          id: "12345",
          name: "Test Workspace",
        },
      ],
    },
    applications: {
      forkingApplication: false,
    },
    selectedWorkspace: {
      loadingStates: {
        isFetchingApplications: false,
      },
    },
  },
});

const mockProps = {
  application: {
    id: "1234",
    name: "My first application",
    color: "#F4FFDE",
    icon: "#fffff",
    workspaceId: "12345",
    defaultPageId: "6697a252ac5b7a4f2c13cbab",
    isPublic: false,
    userPermissions: [
      "export:applications",
      "read:applications",
      "create:pages",
      "manageAutoCommit:applications",
      "canComment:applications",
      "delete:applicationPages",
      "manage:applications",
      "manageProtectedBranches:applications",
      "manageDefaultBranches:applications",
      "connectToGit:applications",
      "publish:applications",
      "delete:applications",
      "makePublic:applications",
    ],
    appIsExample: false,
    slug: "my-first-application",
    pages: [
      {
        id: "6697a252ac5b7a4f2c13cbab",
        isDefault: true,
        name: "Default Page",
        slug: "default-page",
      },
    ],
    modifiedAt: "2024-07-31T10:23:44.189Z",
    applicationVersion: 2,
  },
  isFetchingApplications: false,
  share: jest.fn(),
  delete: jest.fn(),
  update: jest.fn(),
  enableImportExport: true,
  workspaceId: "12345",
};

const mockTheme = {
  colors: {
    appCardColors: ["#FFFFFF", "#000000"],
    applications: {
      cardMenuIcon: "#000000",
    },
    text: {
      heading: "#ffffff",
    },
  },
  card: {
    minWidth: 200,
    minHeight: 100,
  },
};

jest.mock("@appsmith/selectors/applicationSelectors", () => {
  const originalModule = jest.requireActual(
    "@appsmith/selectors/applicationSelectors",
  );
  return {
    __esModule: true,
    ...originalModule,
    getIsSavingAppName: jest.fn(),
    getIsErroredSavingAppName: jest.fn(),
  };
});

jest.mock("../../selectors/gitSyncSelectors", () => {
  const originalModule = jest.requireActual("../../selectors/gitSyncSelectors");
  return {
    __esModule: true,
    ...originalModule,
    getIsGitConnected: jest.fn(),
  };
});

jest.mock("../../selectors/editorSelectors", () => {
  const originalModule = jest.requireActual("../../selectors/editorSelectors");
  return {
    __esModule: true,
    ...originalModule,
    isEditOnlyModeSelector: jest.fn(),
  };
});

describe("ApplicationCard", () => {
  test("triggers update on name change", async () => {
    jest.clearAllMocks();
    (getIsSavingAppName as jest.Mock).mockReturnValue(true);
    (getIsErroredSavingAppName as jest.Mock).mockReturnValue(false);
    (getIsGitConnected as unknown as jest.Mock).mockReturnValue(true);
    (isEditOnlyModeSelector as unknown as jest.Mock).mockReturnValue(true);

    render(
      <Provider store={store}>
        <ThemeProvider theme={mockTheme}>
          <ApplicationCard {...mockProps} />
        </ThemeProvider>
      </Provider>,
    );

    const moreButton = document.getElementsByClassName("m-0.5");
    const moreButtonElement = moreButton[0] as HTMLElement;
    expect(moreButtonElement).toBeInTheDocument();
    fireEvent.click(moreButtonElement);

    const menu = await screen.findByTestId("t--export-app");
    expect(menu).toBeInTheDocument();

    const appNameInput = screen.getAllByText("My first application")[1];
    fireEvent.click(appNameInput);
    await waitFor(() => {
      const inputField = screen.getByPlaceholderText(
        "Edit text input",
      ) as HTMLInputElement;

      fireEvent.change(inputField, {
        target: { value: "Renamed application" },
      });
      expect(inputField.value).toBe("Renamed application");
    });

    const exportButton = screen.getByText("Export");
    fireEvent.click(exportButton);

    expect(toast.show).toHaveBeenCalledWith(
      `Successfully exported Renamed application`,
      {
        kind: "success",
      },
    );
  });
});
