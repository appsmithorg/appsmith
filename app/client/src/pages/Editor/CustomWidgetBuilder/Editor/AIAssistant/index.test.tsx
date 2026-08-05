import React from "react";
import "@testing-library/jest-dom";
import { Provider } from "react-redux";
import { ThemeProvider } from "styled-components";
import { fireEvent, render, screen } from "@testing-library/react";
import configureStore from "redux-mock-store";
import { lightTheme } from "selectors/themeSelectors";
import { CustomWidgetBuilderContext } from "pages/Editor/CustomWidgetBuilder";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { AIAssistant } from ".";

jest.mock("ee/selectors/aiAssistantSelectors", () => ({
  getAIError: (state: { aiAssistant?: { error?: string } }) =>
    state.aiAssistant?.error,
  getAIMessages: (state: { aiAssistant?: { messages?: unknown[] } }) =>
    state.aiAssistant?.messages || [],
  getHasAIApiKey: (state: { aiAssistant?: { hasApiKey?: boolean } }) =>
    Boolean(state.aiAssistant?.hasApiKey),
  getIsAIConfigLoaded: (state: {
    aiAssistant?: { isConfigLoaded?: boolean };
  }) => Boolean(state.aiAssistant?.isConfigLoaded),
  getIsAIEnabled: (state: { aiAssistant?: { isEnabled?: boolean } }) =>
    Boolean(state.aiAssistant?.isEnabled),
  getIsAILoading: (state: { aiAssistant?: { isLoading?: boolean } }) =>
    Boolean(state.aiAssistant?.isLoading),
}));

jest.mock("ee/utils/AnalyticsUtil", () => ({
  __esModule: true,
  default: { logEvent: jest.fn() },
}));

const mockStore = configureStore();

const SRC_DOC = {
  html: "<div id='app'></div>",
  css: ".app { color: blue; }",
  js: "appsmith.onReady(() => {});",
};

interface RenderOptions {
  aiAssistant?: Record<string, unknown>;
  bulkUpdate?: jest.Mock;
}

function renderAssistant(options: RenderOptions = {}) {
  const state: Record<string, unknown> = {
    ui: {
      users: {
        currentUser: { email: "dev@example.com", isSuperUser: true },
      },
    },
  };

  state.aiAssistant = {
    provider: "OPENAI",
    hasApiKey: true,
    isEnabled: true,
    isConfigLoaded: true,
    isLoading: false,
    messages: [],
    isPanelOpen: false,
    editorContext: null,
    ...options.aiAssistant,
  };

  const store = mockStore(state);

  const bulkUpdate = options.bulkUpdate ?? jest.fn();
  // eslint-disable-next-line react-perf/jsx-no-new-object-as-prop -- test render helper, re-renders are irrelevant
  const contextValue = {
    bulkUpdate,
    parentEntityId: "page1",
    uncompiledSrcDoc: SRC_DOC,
    update: jest.fn(),
    widgetId: "widget1",
  };

  render(
    <Provider store={store}>
      <ThemeProvider theme={lightTheme}>
        <CustomWidgetBuilderContext.Provider value={contextValue}>
          <AIAssistant height={600} width={400} />
        </CustomWidgetBuilderContext.Provider>
      </ThemeProvider>
    </Provider>,
  );

  return { store, bulkUpdate };
}

describe("CustomWidgetBuilder AIAssistant", () => {
  it("shows a loading state until the AI config is loaded", () => {
    const { store } = renderAssistant({
      aiAssistant: { isConfigLoaded: false, isEnabled: false },
    });

    expect(
      screen.getByTestId("t--custom-widget-ai-loading-config"),
    ).toBeInTheDocument();
    const types = store.getActions().map((a) => a.type);

    expect(types).toContain(ReduxActionTypes.LOAD_AI_SETTINGS);
    expect(types).toContain(ReduxActionTypes.CLEAR_AI_RESPONSE);
  });

  it("shows the not-configured state when the assistant is disabled", () => {
    renderAssistant({
      aiAssistant: { isEnabled: false, hasApiKey: false },
    });

    expect(
      screen.getByTestId("t--custom-widget-ai-not-configured"),
    ).toBeInTheDocument();
    // Superusers get a shortcut to the settings page
    expect(screen.getByText("Open AI settings")).toBeInTheDocument();
  });

  it("shows the chat with suggested prompts when configured", () => {
    renderAssistant();

    expect(
      screen.getByTestId("t--custom-widget-ai-assistant"),
    ).toBeInTheDocument();
    expect(screen.getByText("Editable data grid")).toBeInTheDocument();
    expect(screen.getByText("Kanban board")).toBeInTheDocument();
  });

  it("sends the prompt with the current widget code as context", () => {
    const { store } = renderAssistant();

    fireEvent.change(screen.getByTestId("t--custom-widget-ai-prompt-input"), {
      target: { value: "Create a counter widget" },
    });
    fireEvent.click(screen.getByTestId("t--custom-widget-ai-send"));

    const fetchAction = store
      .getActions()
      .find((a) => a.type === ReduxActionTypes.FETCH_AI_RESPONSE);

    expect(fetchAction).toBeDefined();
    expect(fetchAction.payload.prompt).toBe("Create a counter widget");
    expect(fetchAction.payload.context.mode).toBe("custom_widget");
    expect(fetchAction.payload.context.functionString).toContain(SRC_DOC.html);
    expect(fetchAction.payload.context.functionString).toContain(SRC_DOC.js);
  });

  it("applies assistant code blocks to the editors and shows chips", () => {
    const bulkUpdate = jest.fn();
    const reply = [
      "Here is a red button.",
      "```css",
      ".app { color: red; }",
      "```",
    ].join("\n");

    renderAssistant({
      bulkUpdate,
      aiAssistant: {
        messages: [
          { role: "user", content: "Make it red", timestamp: 1 },
          { role: "assistant", content: reply, timestamp: 2 },
        ],
      },
    });

    // CSS is replaced; untouched files are preserved from the current srcDoc
    expect(bulkUpdate).toHaveBeenCalledWith({
      html: SRC_DOC.html,
      css: ".app { color: red; }",
      js: SRC_DOC.js,
    });

    // The chat shows the explanation and an applied chip, not the raw code
    expect(screen.getByText("Updated editors:")).toBeInTheDocument();
    expect(screen.getByText("Style")).toBeInTheDocument();
    expect(screen.getByText("Here is a red button.")).toBeInTheDocument();
    expect(screen.queryByText(/color: red/)).not.toBeInTheDocument();
  });

  it("does not re-apply older assistant messages", () => {
    const bulkUpdate = jest.fn();

    renderAssistant({
      bulkUpdate,
      aiAssistant: {
        messages: [
          { role: "assistant", content: "```css\n.a {}\n```", timestamp: 1 },
          { role: "user", content: "thanks", timestamp: 2 },
        ],
      },
    });

    // The latest message is from the user, so nothing is applied
    expect(bulkUpdate).not.toHaveBeenCalled();
  });

  it("shows the error state", () => {
    renderAssistant({
      aiAssistant: { error: "Rate limit exceeded. Please try again later." },
    });

    expect(screen.getByText(/Rate limit exceeded/)).toBeInTheDocument();
  });
});
