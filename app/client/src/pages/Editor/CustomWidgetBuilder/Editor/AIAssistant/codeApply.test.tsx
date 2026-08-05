/**
 * Behaviour contract for applying an assistant reply to the Custom Widget
 * editors.
 *
 * These tests describe what SHOULD happen. They are currently red, and each
 * failure marks a way the assistant can overwrite or drop a user's widget code.
 * The setup deliberately uses the real `aiAssistantReducer` and the real
 * selectors rather than mocks, because the defects live in the interaction
 * between the reducer's state transitions and the apply effect - a mocked
 * store cannot show them.
 */
import React from "react";
import "@testing-library/jest-dom";
import { Provider } from "react-redux";
import { ThemeProvider } from "styled-components";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { combineReducers, createStore } from "redux";
import { lightTheme } from "selectors/themeSelectors";
import { CustomWidgetBuilderContext } from "pages/Editor/CustomWidgetBuilder";
// eslint-disable-next-line @typescript-eslint/no-restricted-imports -- Ask AI is CE-owned; the reducer under test has no ee/ shim.
import { aiAssistantReducer } from "ce/reducers/aiAssistantReducer";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import TabsLayout from "pages/Editor/CustomWidgetBuilder/Editor/Layouts/TabsLayout";
import { CUSTOM_WIDGET_BUILDER_TABS } from "pages/Editor/CustomWidgetBuilder/constants";
import { AIAssistant } from ".";

jest.mock("ee/utils/AnalyticsUtil", () => ({
  __esModule: true,
  default: { logEvent: jest.fn() },
}));

/** Stands in for a widget somebody has already put real work into. */
const EXISTING_WIDGET = {
  html: "<div id='app'><h1>Sales dashboard</h1></div>",
  css: ".app { color: blue; font-family: sans-serif; }",
  js: "appsmith.onReady(() => {\n  renderChart(appsmith.model.rows);\n});",
};

const FEATURE_FLAGS = {
  data: { release_custom_widget_ai_builder: true },
  overriddenFlags: {},
};

function makeStore(aiSettings: {
  provider?: string;
  hasApiKey: boolean;
  isEnabled: boolean;
}) {
  const store = createStore(
    combineReducers({
      aiAssistant: aiAssistantReducer,
      ui: () => ({
        users: {
          currentUser: { email: "dev@example.com", isSuperUser: true },
          featureFlag: FEATURE_FLAGS,
        },
      }),
    }),
  );

  store.dispatch({
    type: ReduxActionTypes.UPDATE_AI_SETTINGS,
    payload: aiSettings,
  });

  return store;
}

function renderAssistant() {
  const store = makeStore({
    provider: "OPENAI",
    hasApiKey: true,
    isEnabled: true,
  });
  const bulkUpdate = jest.fn();
  // eslint-disable-next-line react-perf/jsx-no-new-object-as-prop -- test render helper
  const contextValue = {
    bulkUpdate,
    parentEntityId: "page1",
    uncompiledSrcDoc: EXISTING_WIDGET,
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

  return {
    store,
    bulkUpdate,
    ask: (prompt: string) =>
      act(() => {
        store.dispatch({
          type: ReduxActionTypes.FETCH_AI_RESPONSE,
          payload: { prompt },
        });
      }),
    reply: (response: string) =>
      act(() => {
        store.dispatch({
          type: ReduxActionTypes.FETCH_AI_RESPONSE_SUCCESS,
          payload: { response },
        });
      }),
  };
}

describe("applying an assistant reply to the editors", () => {
  it("leaves the widget alone when the reply only answers a question", () => {
    const { ask, bulkUpdate, reply } = renderAssistant();

    ask("How do I read the model inside a custom widget?");

    // The server's system prompt tells the model to tag every snippet with a
    // language identifier ("```javascript, ```sql, etc."), so an ordinary
    // answer looks like this. It is an illustration, not a new version of the
    // file, and must not be written to the JS editor.
    reply(
      [
        "You can read it from the global `appsmith` object:",
        "",
        "```javascript",
        "console.log(appsmith.model.rows);",
        "```",
        "",
        "It refreshes whenever the host app updates the model.",
      ].join("\n"),
    );

    expect(bulkUpdate).not.toHaveBeenCalled();
  });

  it("applies nothing when the reply was cut off mid code block", () => {
    const { ask, bulkUpdate, reply } = renderAssistant();

    ask("Make the heading red");

    // Providers cap output length (Claude is called with max_tokens 8192) while
    // the prompt asks for the COMPLETE contents of every changed file, so a
    // reply can end inside a block. Applying the blocks that did close leaves
    // new markup next to the old JS, which is a broken widget.
    reply(
      [
        "Done - updated all three files.",
        "```html",
        "<div id='app'><h1 class='hot'>Sales dashboard</h1></div>",
        "```",
        "```css",
        ".hot { color: red; }",
        "```",
        "```js",
        "appsmith.onReady(() => {",
        "  renderChart(appsmith.model.rows);",
      ].join("\n"),
    );

    expect(bulkUpdate).not.toHaveBeenCalled();
    expect(screen.getByText(/AI response was incomplete/)).toBeInTheDocument();
  });

  it("does not apply a reply after the user stops generation", () => {
    const { ask, bulkUpdate, reply, store } = renderAssistant();

    ask("Rewrite the widget as a kanban board");
    expect(store.getState().aiAssistant.isLoading).toBe(true);

    fireEvent.click(screen.getByTestId("t--custom-widget-ai-cancel"));

    // Stopping should end the request while keeping the conversation visible.
    expect(store.getState().aiAssistant.isLoading).toBe(false);

    // If the in-flight request still lands, its code must not be written to
    // editors the user has already walked away from.
    reply("Here you go.\n```js\nrenderKanban();\n```");

    expect(bulkUpdate).not.toHaveBeenCalled();
  });

  it("normalises line endings so no carriage returns reach the editors", () => {
    const { ask, bulkUpdate, reply } = renderAssistant();

    ask("tweak the css");
    reply("ok\r\n```css\r\n.a { color: red; }\r\n```\r\n");

    expect(bulkUpdate.mock.calls[0][0].css).toBe(".a { color: red; }");
  });
});

describe("which builder tab opens first", () => {
  beforeEach(() => window.localStorage.clear());

  it("does not open on the AI tab when no AI provider is configured", () => {
    // A default instance has the assistant switched off and no key stored.
    const store = makeStore({ hasApiKey: false, isEnabled: false });
    // eslint-disable-next-line react-perf/jsx-no-new-object-as-prop -- test render helper
    const contextValue = {
      bulkUpdate: jest.fn(),
      parentEntityId: "page1",
      uncompiledSrcDoc: EXISTING_WIDGET,
      update: jest.fn(),
      widgetId: "widget1",
    };

    // eslint-disable-next-line react-perf/jsx-no-new-array-as-prop -- test render helper, re-renders are irrelevant
    const tabs = [
      {
        title: CUSTOM_WIDGET_BUILDER_TABS.HTML,
        children: () => <div>html</div>,
      },
      {
        title: CUSTOM_WIDGET_BUILDER_TABS.STYLE,
        children: () => <div>style</div>,
      },
      { title: CUSTOM_WIDGET_BUILDER_TABS.JS, children: () => <div>js</div> },
      {
        title: CUSTOM_WIDGET_BUILDER_TABS.AI,
        children: () => <AIAssistant height={600} width={400} />,
      },
    ];

    render(
      <Provider store={store}>
        <ThemeProvider theme={lightTheme}>
          <CustomWidgetBuilderContext.Provider value={contextValue}>
            <TabsLayout tabs={tabs} />
          </CustomWidgetBuilderContext.Provider>
        </ThemeProvider>
      </Provider>,
    );

    const activeTab = document.querySelector(
      '[role="tab"][data-state="active"]',
    );

    expect(activeTab?.textContent).toBe(CUSTOM_WIDGET_BUILDER_TABS.HTML);
  });
});
