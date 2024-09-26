import _ from "lodash";
import configureStore from "redux-mock-store";

const PAGE_ID = "0123456789abcdef00000000";
const BASE_PAGE_ID = "0123456789abcdef00000022";

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const initialState: any = {
  entities: {
    pageList: {
      applicationId: "1",
      currentPageId: PAGE_ID,
      currentBasePageId: BASE_PAGE_ID,
      pages: [
        {
          pageId: PAGE_ID,
          basePageId: BASE_PAGE_ID,
          slug: "pageSlug",
        },
      ],
    },
    datasources: {
      list: [],
    },
    actions: [],
    canvasWidgets: {
      main_component: {},
    },
  },
  evaluations: {
    dependencies: {
      inverseDependencyMap: {},
    },
  },
  ui: {
    applications: {
      currentApplication: {
        lastDeployedAt: null,
        slug: "applicationSlug",
      },
    },
    onBoarding: {
      firstTimeUserOnboardingComplete: false,
      showFirstTimeUserOnboardingModal: true,
      firstTimeUserOnboardingApplicationIds: ["1"],
      stepState: [],
    },
    theme: {
      theme: {
        colors: {
          applications: {
            iconColor: "#f2f2f2",
          },
          success: {
            main: "#e2e2e2",
          },
        },
      },
    },
    users: {
      featureFlag: {
        data: {},
      },
    },
    editor: {},
  },
};
let state = JSON.parse(JSON.stringify(initialState));
const mockStore = configureStore();

export function getStore(step: number) {
  switch (step) {
    // Step 0: Base State - Use this for the initial setup before making any changes to the state.
    case 0:
      state = _.cloneDeep(initialState);
      break;
    // Step 1: Adding a Datasource - Use this if your test involves a scenario where a datasource is added.
    case 1:
      state.entities.datasources.list.push({});
      break;
    // Step 2: Adding an Action with PageId - Use this if your test involves a scenario where an action with a `pageId` is added.
    case 2:
      state.entities.actions.push({ config: { pageId: PAGE_ID } });
      break;
    // Step 3: Adding an Action and Canvas Widget - Use this if your test involves a scenario where an action and a canvas widget are added.
    case 3:
      state.entities.actions = [
        {
          config: {
            id: Math.random(),
            pageId: PAGE_ID,
            name: "Query",
          },
        },
      ];
      state.entities.canvasWidgets[Math.random()] = {
        widgetName: "widget",
        onClick: "",
        dynamicTriggerPathList: [],
        text: "",
      };
      break;
    // Step 4: Adding an Action with Dynamic Trigger and Canvas Widget - Use this if your test involves a scenario where an action with a dynamic trigger and a canvas widget are added.
    case 4:
      state.entities.actions = [
        {
          config: {
            id: Math.random(),
            pageId: PAGE_ID,
            name: "Query",
          },
        },
      ];
      state.entities.canvasWidgets[Math.random()] = {
        widgetName: "widget",
        onClick: "{{Query.run()}}",
        dynamicTriggerPathList: [
          {
            key: "onClick",
          },
        ],
        text: "{{Query.data}}",
      };
      state.evaluations.dependencies.inverseDependencyMap = {
        "Query.data": ["widget.text"],
      };
      break;
    // Step 5: Updating UI State - Use this if your test involves a scenario where UI-related states are updated.
    case 5:
      state.ui.applications.currentApplication.lastDeployedAt = Math.random();
      state.ui.onBoarding.firstTimeUserOnboardingComplete = true;
      break;
  }

  return mockStore(state);
}
