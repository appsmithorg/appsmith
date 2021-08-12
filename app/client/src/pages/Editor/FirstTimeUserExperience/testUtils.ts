import configureStore from "redux-mock-store";

const initialState: any = {
  entities: {
    pageList: {
      applicationId: Math.random(),
      currentPageId: Math.random(),
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
      },
    },
    onBoarding: {
      firstTimeUserExperienceComplete: false,
    },
    theme: {
      theme: {
        colors: {
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
      state = JSON.parse(JSON.stringify(initialState));
      break;
    case 1:
      state.entities.datasources.list.push({});
      break;
    case 2:
      state.entities.actions.push({});
      break;
    case 3:
      state.entities.canvasWidgets[Math.random()] = {};
      break;
    case 4:
      break;
    case 5:
      state.ui.applications.currentApplication.lastDeployedAt = Math.random();
      state.ui.onBoarding.firstTimeUserExperienceComplete = true;
      break;
  }
  return mockStore(state);
}
