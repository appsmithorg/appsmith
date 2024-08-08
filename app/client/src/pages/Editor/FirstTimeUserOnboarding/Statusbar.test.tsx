const dispatch = jest.fn();

import React from "react";
import { Provider } from "react-redux";
import { render } from "test/testUtils";
import OnboardingStatusbar from "./Statusbar";
import { getStore } from "./testUtils";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { SIGNPOSTING_STEP } from "./Utils";
import { signpostingStepUpdateInit } from "actions/onboardingActions";
import * as onboardingSelectors from "selectors/onboardingSelectors";

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let container: any = null;

jest.mock("react-redux", () => {
  const originalModule = jest.requireActual("react-redux");
  return {
    ...originalModule,
    useDispatch: () => dispatch,
  };
});

jest.mock("../../../selectors/onboardingSelectors", () => {
  const originalModule = jest.requireActual(
    "../../../selectors/onboardingSelectors",
  );
  return {
    ...originalModule,
    isWidgetActionConnectionPresent: jest.fn(),
  };
});

const originalOnboardingSelectors = jest.requireActual(
  "../../../selectors/onboardingSelectors",
);

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("is rendered", async () => {
    renderComponent(getStore(0));
    expect(dispatch).toHaveBeenCalledTimes(5);
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: {
          completed: false,
          step: expect.any(String),
        },
        type: ReduxActionTypes.SIGNPOSTING_STEP_UPDATE_INIT,
      }),
    );
  });

  it("on completing first step", async () => {
    renderComponent(getStore(1));
    expect(dispatch).toHaveBeenNthCalledWith(
      1,
      signpostingStepUpdateInit({
        step: SIGNPOSTING_STEP.CONNECT_A_DATASOURCE,
        completed: true,
      }),
    );
  });

  it("on completing second step", async () => {
    renderComponent(getStore(2));
    expect(dispatch).toHaveBeenNthCalledWith(
      2,
      signpostingStepUpdateInit({
        step: SIGNPOSTING_STEP.CREATE_A_QUERY,
        completed: true,
      }),
    );
  });

  it("on completing third step", async () => {
    renderComponent(getStore(3));
    expect(dispatch).toHaveBeenNthCalledWith(
      3,
      signpostingStepUpdateInit({
        step: SIGNPOSTING_STEP.ADD_WIDGETS,
        completed: true,
      }),
    );
  });

  it("on completing fourth step", async () => {
    const isWidgetActionConnectionPresentSelector = jest.spyOn(
      onboardingSelectors,
      "isWidgetActionConnectionPresent",
    );
    isWidgetActionConnectionPresentSelector.mockImplementation(() => {
      return true;
    });
    renderComponent(getStore(4));
    expect(dispatch).toHaveBeenNthCalledWith(
      4,
      signpostingStepUpdateInit({
        step: SIGNPOSTING_STEP.CONNECT_DATA_TO_WIDGET,
        completed: true,
      }),
    );
  });

  it("on completing fifth step", async () => {
    renderComponent(getStore(5));
    expect(dispatch).toHaveBeenNthCalledWith(
      5,
      signpostingStepUpdateInit({
        step: SIGNPOSTING_STEP.DEPLOY_APPLICATIONS,
        completed: true,
      }),
    );
  });

  it("should test useIsWidgetActionConnectionPresent function", () => {
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const store = getStore(4).getState() as any;
    const isWidgetActionConnectionPresentHelper = () => {
      return originalOnboardingSelectors.isWidgetActionConnectionPresent.resultFunc(
        store.entities.canvasWidgets,
        store.entities.actions,
        store.evaluations.dependencies.inverseDependencyMap,
      );
    };
    //Both property and trigger dependency present
    expect(isWidgetActionConnectionPresentHelper()).toBe(true);
    //only trigger dependency present
    store.evaluations.dependencies.inverseDependencyMap = {};
    expect(isWidgetActionConnectionPresentHelper()).toBe(true);
    //no dependency present
    store.entities.canvasWidgets = {};
    store.entities.actions = [];
    expect(isWidgetActionConnectionPresentHelper()).toBe(false);
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
    expect(isWidgetActionConnectionPresentHelper()).toBe(true);
    //no dependency present
    store.entities.canvasWidgets = {};
    store.entities.actions = [];
    expect(isWidgetActionConnectionPresentHelper()).toBe(false);
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
    expect(isWidgetActionConnectionPresentHelper()).toBe(true);
    //no dependency present
    store.entities.canvasWidgets = {};
    store.entities.actions = [];
    expect(isWidgetActionConnectionPresentHelper()).toBe(false);
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
    expect(isWidgetActionConnectionPresentHelper()).toBe(true);
  });
});
