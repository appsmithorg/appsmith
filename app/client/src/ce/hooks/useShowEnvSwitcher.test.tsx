import React from "react";
import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import configureMockStore from "redux-mock-store";
import useShowEnvSwitcher from "./useShowEnvSwitcher";

const spier = {
  useShowEnvSwitcher: useShowEnvSwitcher,
};

const useShowEnvSwitcherSpy = jest.spyOn(spier, "useShowEnvSwitcher");

const MockEl = ({ viewMode = false }: { viewMode?: boolean } = {}) => {
  spier.useShowEnvSwitcher({ viewMode });
  return <div />;
};

const renderMockElement = ({
  store,
  viewMode,
}: {
  store: any;
  viewMode: boolean;
}) => {
  return render(
    <Provider store={store}>
      <MockEl viewMode={viewMode} />
    </Provider>,
  );
};

describe("BottomBar environment switcher", () => {
  it("should render when admin in edit mode", () => {
    const mockStore = configureMockStore();
    const store = mockStore({
      ui: {
        selectedWorkspace: {
          workspace: {},
        },
        applications: {
          currentApplication: {
            userPermissions: ["manage:applications"],
          },
        },
        users: {
          featureFlag: {
            data: {
              release_datasource_environments_enabled: false,
            },
          },
          currentUser: {
            isSuperUser: true,
          },
        },
        editor: {
          isPreviewMode: false,
        },
      },
    });
    renderMockElement({ store, viewMode: false });
    expect(useShowEnvSwitcherSpy).lastReturnedWith(true);
  });
  it("should render when dev in edit mode", () => {
    const mockStore = configureMockStore();
    const store = mockStore({
      ui: {
        selectedWorkspace: {
          workspace: {},
        },
        applications: {
          currentApplication: {
            userPermissions: ["manage:applications"],
          },
        },
        users: {
          featureFlag: {
            data: {
              release_datasource_environments_enabled: false,
            },
          },
          currentUser: {
            isSuperUser: false,
          },
        },
        editor: {
          isPreviewMode: false,
        },
      },
    });
    renderMockElement({ store, viewMode: false });
    expect(useShowEnvSwitcherSpy).lastReturnedWith(true);
  });
  it("should render when viewer in edit mode", () => {
    const mockStore = configureMockStore();
    const store = mockStore({
      ui: {
        selectedWorkspace: {
          workspace: {},
        },
        applications: {
          currentApplication: {
            userPermissions: [],
          },
        },
        users: {
          featureFlag: {
            data: {
              release_datasource_environments_enabled: false,
            },
          },
          currentUser: {
            isSuperUser: false,
          },
        },
        editor: {
          isPreviewMode: false,
        },
      },
    });
    renderMockElement({ store, viewMode: false });
    expect(useShowEnvSwitcherSpy).lastReturnedWith(false);
  });

  it("should render when admin in preview mode", () => {
    const mockStore = configureMockStore();
    const store = mockStore({
      ui: {
        selectedWorkspace: {
          workspace: {},
        },
        applications: {
          currentApplication: {
            userPermissions: ["manage:applications"],
          },
        },
        users: {
          featureFlag: {
            data: {
              release_datasource_environments_enabled: false,
            },
          },
          currentUser: {
            isSuperUser: true,
          },
        },
        editor: {
          isPreviewMode: true,
        },
      },
    });
    renderMockElement({ store, viewMode: false });
    expect(useShowEnvSwitcherSpy).lastReturnedWith(false);
  });
  it("should render when dev in preview mode", () => {
    const mockStore = configureMockStore();
    const store = mockStore({
      ui: {
        selectedWorkspace: {
          workspace: {},
        },
        applications: {
          currentApplication: {
            userPermissions: ["manage:applications"],
          },
        },
        users: {
          featureFlag: {
            data: {
              release_datasource_environments_enabled: false,
            },
          },
          currentUser: {
            isSuperUser: false,
          },
        },
        editor: {
          isPreviewMode: true,
        },
      },
    });
    renderMockElement({ store, viewMode: false });
    expect(useShowEnvSwitcherSpy).lastReturnedWith(false);
  });
  it("should render when viewer in preview mode", () => {
    const mockStore = configureMockStore();
    const store = mockStore({
      ui: {
        selectedWorkspace: {
          workspace: {},
        },
        applications: {
          currentApplication: {
            userPermissions: [],
          },
        },
        users: {
          featureFlag: {
            data: {
              release_datasource_environments_enabled: false,
            },
          },
          currentUser: {
            isSuperUser: false,
          },
        },
        editor: {
          isPreviewMode: true,
        },
      },
    });
    renderMockElement({ store, viewMode: false });
    expect(useShowEnvSwitcherSpy).lastReturnedWith(false);
  });

  it("should render when admin in view mode", () => {
    const mockStore = configureMockStore();
    const store = mockStore({
      ui: {
        selectedWorkspace: {
          workspace: {},
        },
        applications: {
          currentApplication: {
            userPermissions: ["manage:applications"],
          },
        },
        users: {
          featureFlag: {
            data: {
              release_datasource_environments_enabled: false,
            },
          },
          currentUser: {
            isSuperUser: true,
          },
        },
        editor: {
          isPreviewMode: false,
        },
      },
    });
    renderMockElement({ store, viewMode: true });
    expect(useShowEnvSwitcherSpy).lastReturnedWith(false);
  });
  it("should render when dev in view mode", () => {
    const mockStore = configureMockStore();
    const store = mockStore({
      ui: {
        selectedWorkspace: {
          workspace: {},
        },
        applications: {
          currentApplication: {
            userPermissions: ["manage:applications"],
          },
        },
        users: {
          featureFlag: {
            data: {
              release_datasource_environments_enabled: false,
            },
          },
          currentUser: {
            isSuperUser: false,
          },
        },
        editor: {
          isPreviewMode: false,
        },
      },
    });
    renderMockElement({ store, viewMode: true });
    expect(useShowEnvSwitcherSpy).lastReturnedWith(false);
  });
  it("should render when viewer in view mode", () => {
    const mockStore = configureMockStore();
    const store = mockStore({
      ui: {
        selectedWorkspace: {
          workspace: {},
        },
        applications: {
          currentApplication: {
            userPermissions: [],
          },
        },
        users: {
          featureFlag: {
            data: {
              release_datasource_environments_enabled: false,
            },
          },
          currentUser: {
            isSuperUser: false,
          },
        },
        editor: {
          isPreviewMode: false,
        },
      },
    });
    renderMockElement({ store, viewMode: true });
    expect(useShowEnvSwitcherSpy).lastReturnedWith(false);
  });
});
