import _ from "lodash";
import configureStore from "redux-mock-store";

const PAGE_ID = 2;
export const initialState: any = {
  entities: {
    pageList: {
      applicationId: 1,
      currentPageId: PAGE_ID,
      pages: [
        {
          pageId: PAGE_ID,
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
      enableFirstTimeUserOnboarding: true,
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
  },
};
let state = JSON.parse(JSON.stringify(initialState));
const mockStore = configureStore();

export function getStore(step: number) {
  switch (step) {
    case 0:
      state = _.cloneDeep(initialState);
      break;
    case 1:
      state.entities.datasources.list.push({});
      break;
    case 2:
      state.entities.actions.push({ config: { pageId: PAGE_ID } });
      break;
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
    case 5:
      state.ui.applications.currentApplication.lastDeployedAt = Math.random();
      state.ui.onBoarding.firstTimeUserOnboardingComplete = true;
      break;
  }
  return mockStore(state);
}
