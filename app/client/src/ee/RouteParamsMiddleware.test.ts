import type { MockStoreEnhanced } from "redux-mock-store";
import configureStore from "redux-mock-store";
import routeParamsMiddleware from "./RouteParamsMiddleware";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import urlBuilder from "@appsmith/entities/URLRedirect/URLAssembly";

const middlewares = [routeParamsMiddleware]; // Include your middleware here
const mockStore = configureStore(middlewares);

describe("RouteParamsMiddleware", () => {
  let store: MockStoreEnhanced<unknown, object>;

  beforeEach(() => {
    store = mockStore({});
    urlBuilder.setPackageParams({});
    urlBuilder.setModulesParams(() => ({}));
  });

  it("should handle FETCH_PACKAGE_SUCCESS action", () => {
    const action = {
      type: ReduxActionTypes.FETCH_PACKAGE_SUCCESS,
      payload: {
        modules: [{ id: "module1" }],
        packageData: { id: "package1" },
      },
    };

    // Before
    expect(urlBuilder.getPackageParams()).toEqual({});
    expect(urlBuilder.getModulesParams()).toEqual({});

    store.dispatch(action);

    // After
    expect(urlBuilder.getPackageParams()).toEqual({
      packageId: "package1",
      packageSlug: "",
    });

    expect(urlBuilder.getModulesParams()).toEqual({
      module1: {
        moduleId: "module1",
        moduleSlug: "",
      },
    });
  });

  it("should handle CREATE_PACKAGE_FROM_WORKSPACE_SUCCESS action", () => {
    const action = {
      type: ReduxActionTypes.CREATE_PACKAGE_FROM_WORKSPACE_SUCCESS,
      payload: { id: "package2" },
    };

    // Before
    expect(urlBuilder.getPackageParams()).toEqual({});
    expect(urlBuilder.getModulesParams()).toEqual({});

    store.dispatch(action);

    // After
    expect(urlBuilder.getPackageParams()).toEqual({
      packageId: "package2",
      packageSlug: "",
    });

    expect(urlBuilder.getModulesParams()).toEqual({});
  });

  it("should handle UPDATE_PACKAGE_SUCCESS action", () => {
    const action = {
      type: ReduxActionTypes.UPDATE_PACKAGE_SUCCESS,
      payload: { id: "package3" },
    };

    // Setup initial state
    urlBuilder.setPackageParams({
      packageId: "package3",
      packageSlug: "", // TODO: (Ashit) update tests after slugs
    });
    urlBuilder.setModulesParams(() => ({
      module1: {
        moduleId: "module1",
        moduleSlug: "", // TODO: (Ashit) update tests after slugs
      },
    }));

    store.dispatch(action);

    expect(urlBuilder.getPackageParams()).toEqual({
      packageId: "package3",
      packageSlug: "",
    });

    expect(urlBuilder.getModulesParams()).toEqual({
      module1: {
        moduleId: "module1",
        moduleSlug: "",
      },
    });
  });

  it("should handle SAVE_MODULE_NAME_SUCCESS action", () => {
    const action = {
      type: ReduxActionTypes.SAVE_MODULE_NAME_SUCCESS,
      payload: { id: "module2" },
    };

    // Setup initial state
    urlBuilder.setPackageParams({
      packageId: "package3",
      packageSlug: "", // TODO: (Ashit) update tests after slugs
    });
    urlBuilder.setModulesParams(() => ({
      module1: {
        moduleId: "module1",
        moduleSlug: "", // TODO: (Ashit) update tests after slugs
      },
      module2: {
        moduleId: "module2",
        moduleSlug: "", // TODO: (Ashit) update tests after slugs
      },
    }));

    store.dispatch(action);

    expect(urlBuilder.getModulesParams()).toEqual({
      module1: {
        moduleId: "module1",
        moduleSlug: "",
      },
      module2: {
        moduleId: "module2",
        moduleSlug: "",
      },
    });
  });

  it("should handle CREATE_QUERY_MODULE_SUCCESS action", () => {
    const action = {
      type: ReduxActionTypes.CREATE_QUERY_MODULE_SUCCESS,
      payload: { id: "module2" },
    };

    // Setup initial state
    urlBuilder.setPackageParams({
      packageId: "package3",
      packageSlug: "", // TODO: (Ashit) update tests after slugs
    });
    urlBuilder.setModulesParams(() => ({
      module1: {
        moduleId: "module1",
        moduleSlug: "", // TODO: (Ashit) update tests after slugs
      },
    }));

    store.dispatch(action);

    expect(urlBuilder.getModulesParams()).toEqual({
      module1: {
        moduleId: "module1",
        moduleSlug: "",
      },
      module2: {
        moduleId: "module2",
        moduleSlug: "",
      },
    });
  });
});
