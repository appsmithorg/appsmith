import React from "react";
import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { StaticRouter } from "react-router";
import { ScimProvisioning } from "./ScimProvisioning";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import AdminConfig from "@appsmith/pages/AdminSettings/config";
import router from "react-router";
import { theme } from "constants/DefaultTheme";
import { ThemeProvider } from "styled-components";
import {
  API_KEY_TO_SETUP_SCIM,
  DISABLE_SCIM,
  GENERATE_API_KEY,
  RECONFIGURE_API_KEY,
  createMessage,
} from "@appsmith/constants/messages";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

let container: any = null;
const mockDispatch = jest.fn();
jest.mock("react-redux", () => ({
  ...jest.requireActual("react-redux"),
  useDispatch: () => mockDispatch,
}));

// Create a mock for AdminConfig.getCategoryDetails
jest.mock("@appsmith/pages/AdminSettings/config");

// Define the mock behavior and return value
(AdminConfig.getCategoryDetails as any).mockImplementation(
  (category: string, subCategory: string) => {
    if (category === "provisioning" && subCategory === "scim") {
      return {
        title: "dummy title",
        subText: "dummy subtext",
      };
    }

    // Return a default value if the input parameters don't match any predefined values
    return {
      title: "Default Category",
      subText: "Default Subcategory",
    };
  },
);

const reduxState = {
  provisioning: {
    apiKey: "dummyApiKey",
    configuredStatus: true,
    isLoading: {
      apiKey: false,
      disconnectProvisioning: false,
      provisionStatus: false,
    },
    provisionStatus: "active",
    lastUpdatedAt: new Date().toISOString(),
    provisionedUsers: 10,
    provisionedGroups: 5,
  },
};

function renderComponent(state?: any) {
  /* Mock store to bypass the error of react-redux */
  const store = configureStore()(state || reduxState);
  return render(
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <StaticRouter>
          <ScimProvisioning />
        </StaticRouter>
      </ThemeProvider>
    </Provider>,
  );
}

describe("ScimProvisioning", () => {
  beforeEach(() => {
    // Mock the useParams hook to return dummy params
    jest.spyOn(router, "useParams" as any).mockReturnValue({
      category: "provisioning",
      selected: "scim",
    });
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  it("should render the component with the correct title and subText", () => {
    renderComponent();

    // Assert the title and subText are correctly displayed
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "dummy title",
    );
    expect(screen.queryByRole("heading", { level: 2 })).not.toBeInTheDocument();
  });

  it("should render the connected status when configured", async () => {
    renderComponent();

    // Assert that the connected status is displayed
    expect(screen.getByText("Connection Active")).toBeInTheDocument();
    expect(screen.getByTestId("last-sync-info")).toBeInTheDocument();
    expect(screen.getByTestId("synced-resources-info")).toBeInTheDocument();
    expect(screen.getByText("10 users")).toBeInTheDocument();
    expect(screen.getByText("5 groups")).toBeInTheDocument();
    expect(screen.getByText("are linked to your IDP")).toBeInTheDocument();

    const disableButton = screen.getByRole("button", {
      name: createMessage(DISABLE_SCIM),
    });
    expect(disableButton).toBeInTheDocument();
    await fireEvent.click(disableButton);
    const modal = screen.queryByRole("dialog");
    expect(modal).toBeTruthy();
  });

  it("should render the callout when not configured", async () => {
    renderComponent({
      ...reduxState,
      provisioning: {
        ...reduxState.provisioning,
        configuredStatus: false,
      },
    });

    // Assert the title and subText are correctly displayed
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "dummy title",
    );
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "dummy subtext",
    );

    // Assert that the callout is displayed
    expect(screen.getByTestId("scim-callout")).toBeInTheDocument();

    // Assert that the API key and button are displayed
    expect(
      screen.getByText(createMessage(API_KEY_TO_SETUP_SCIM)),
    ).toBeInTheDocument();
    const generateApiKeyButton = screen.getByRole("button", {
      name: createMessage(GENERATE_API_KEY),
    });
    let apiKeyField = await screen.queryByTestId("scim-api-key");
    expect(generateApiKeyButton).toBeInTheDocument();
    expect(apiKeyField).not.toBeInTheDocument();
    await fireEvent.click(generateApiKeyButton);
    apiKeyField = await screen.queryByTestId("scim-api-key");
    expect(apiKeyField).toBeInTheDocument();
    expect(apiKeyField?.getElementsByTagName("input")?.[0]).toHaveValue(
      "dummyApiKey",
    );
  });

  it("should render a button to regenerate the API key", async () => {
    renderComponent();

    // Assert that the reconfigure api key button is displayed
    expect(
      screen.getByText(createMessage(API_KEY_TO_SETUP_SCIM)),
    ).toBeInTheDocument();
    const reconfigureApiKeyButton = screen.getByRole("button", {
      name: createMessage(RECONFIGURE_API_KEY),
    });
    let apiKeyField = await screen.queryByTestId("scim-api-key");
    expect(reconfigureApiKeyButton).toBeInTheDocument();
    expect(apiKeyField).not.toBeInTheDocument();
    await fireEvent.click(reconfigureApiKeyButton);
    apiKeyField = await screen.queryByTestId("scim-api-key");
    expect(apiKeyField).toBeInTheDocument();
    expect(apiKeyField?.getElementsByTagName("input")?.[0]).toHaveValue(
      "dummyApiKey",
    );
  });

  it("should dispatch the generateProvisioningApiKey action when the Regenerate API Key button is clicked", async () => {
    renderComponent();

    // Click the Regenerate API Key button
    await fireEvent.click(
      screen.getByRole("button", { name: createMessage(RECONFIGURE_API_KEY) }),
    );

    // Assert that the dispatch function was called with the expected action
    expect(mockDispatch).toHaveBeenCalledWith({
      type: ReduxActionTypes.GENERATE_PROVISIONING_API_KEY,
    });
  });
});
