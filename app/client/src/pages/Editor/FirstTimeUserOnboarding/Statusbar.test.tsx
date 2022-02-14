import React from "react";
import { Provider } from "react-redux";
import { render, screen } from "test/testUtils";
import OnboardingStatusbar from "./Statusbar";
import { getStore } from "./testUtils";
import {
  ONBOARDING_STATUS_STEPS_FIRST,
  ONBOARDING_STATUS_STEPS_SECOND,
  ONBOARDING_STATUS_STEPS_THIRD,
  ONBOARDING_STATUS_STEPS_FOURTH,
  ONBOARDING_STATUS_STEPS_FIVETH,
  ONBOARDING_STATUS_STEPS_SIXTH,
} from "@appsmith/constants/messages";
import { useIsWidgetActionConnectionPresent } from "pages/Editor/utils";

let container: any = null;

function renderComponent(store: any) {
  render(
    <Provider store={store}>
      <OnboardingStatusbar />
    </Provider>,
    container,
  );
}

describe("Statusbar", () => {
  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  it("is rendered", async (done) => {
    renderComponent(getStore(0));
    const statusbar = screen.queryAllByTestId("statusbar-container");
    expect(statusbar).toHaveLength(1);
    done();
  });

  it("is pro", async (done) => {
    renderComponent(getStore(0));
    const statusbar = screen.queryAllByTestId("statusbar-container");
    expect(statusbar).not.toBeNull();
    done();
  });

  it("is showing first step", async () => {
    renderComponent(getStore(0));
    const statusbarText = screen.queryAllByTestId("statusbar-text");
    expect(statusbarText[0].innerHTML).toBe(ONBOARDING_STATUS_STEPS_FIRST());
  });

  it("is showing second step", async () => {
    renderComponent(getStore(1));
    const statusbarText = screen.queryAllByTestId("statusbar-text");
    expect(statusbarText[0].innerHTML).toBe(ONBOARDING_STATUS_STEPS_SECOND());
  });

  it("is showing third step", async () => {
    renderComponent(getStore(2));
    const statusbarText = screen.queryAllByTestId("statusbar-text");
    expect(statusbarText[0].innerHTML).toBe(ONBOARDING_STATUS_STEPS_THIRD());
  });

  it("is showing fourth step", async () => {
    renderComponent(getStore(3));
    const statusbarText = screen.queryAllByTestId("statusbar-text");
    expect(statusbarText[0].innerHTML).toBe(ONBOARDING_STATUS_STEPS_FOURTH());
  });

  it("is showing fifth step", async () => {
    renderComponent(getStore(4));
    const statusbarText = screen.queryAllByTestId("statusbar-text");
    expect(statusbarText[0].innerHTML).toBe(ONBOARDING_STATUS_STEPS_FIVETH());
  });

  it("is showing sixth step", async () => {
    renderComponent(getStore(5));
    const statusbarText = screen.queryAllByTestId("statusbar-text");
    expect(statusbarText[0].innerHTML).toBe(ONBOARDING_STATUS_STEPS_SIXTH());
  });

  it("should test useIsWidgetActionConnectionPresent function", () => {
    const store = getStore(4).getState() as any;
    const useIsWidgetActionConnectionPresentHelper = () => {
      return useIsWidgetActionConnectionPresent(
        store.entities.canvasWidgets,
        store.entities.actions,
        store.evaluations.dependencies.inverseDependencyMap,
      );
    };
    //Both property and trigger dependency present
    expect(useIsWidgetActionConnectionPresentHelper()).toBe(true);
    //only trigger dependency present
    store.evaluations.dependencies.inverseDependencyMap = {};
    expect(useIsWidgetActionConnectionPresentHelper()).toBe(true);
    //no dependency present
    store.entities.canvasWidgets = {};
    store.entities.actions = [];
    expect(useIsWidgetActionConnectionPresentHelper()).toBe(false);
    //only trigger dependency present
    store.entities.canvasWidgets = {
      [Math.random()]: {
        widgetName: "widget",
        onClick: "{{Query.run()}}",
        dynamicTriggerPathList: [
          {
            key: "onClick",
          },
        ],
        text: "{{Query.data}}",
      },
    };
    store.entities.actions = [
      {
        config: {
          id: Math.random(),
          pageId: 1,
          name: "Query",
        },
      },
    ];
    expect(useIsWidgetActionConnectionPresentHelper()).toBe(true);
    //no dependency present
    store.entities.canvasWidgets = {};
    store.entities.actions = [];
    expect(useIsWidgetActionConnectionPresentHelper()).toBe(false);
    //only nested trigger dependency present
    store.entities.canvasWidgets = {
      [Math.random()]: {
        widgetName: "widget",
        column: {
          onClick: "{{Query.run()}}",
        },
        dynamicTriggerPathList: [
          {
            key: "column.onClick",
          },
        ],
        text: "label",
      },
    };
    store.entities.actions = [
      {
        config: {
          id: Math.random(),
          pageId: 1,
          name: "Query",
        },
      },
    ];
    expect(useIsWidgetActionConnectionPresentHelper()).toBe(true);
    //no dependency present
    store.entities.canvasWidgets = {};
    store.entities.actions = [];
    expect(useIsWidgetActionConnectionPresentHelper()).toBe(false);
    //only property dependency present
    store.entities.canvasWidgets = {
      [Math.random()]: {
        widgetName: "widget",
        dynamicTriggerPathList: [],
        text: "{{Query.data}}",
      },
    };
    store.entities.actions = [
      {
        config: {
          id: Math.random(),
          pageId: 1,
          name: "Query",
        },
      },
    ];
    store.evaluations.dependencies.inverseDependencyMap = {
      "Query.data": ["Query", "widget.text"],
    };
    expect(useIsWidgetActionConnectionPresentHelper()).toBe(true);
  });
});
