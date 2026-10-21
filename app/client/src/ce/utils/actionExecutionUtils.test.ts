import {
  getTestPayloadFromCollectionData,
  shouldLogActionExecution,
} from "./actionExecutionUtils";
import type { JSCollectionData } from "ee/reducers/entityReducers/jsActionsReducer";
import { APP_MODE } from "entities/App";
import { PluginType } from "entities/Plugin";
import configureStore from "redux-mock-store";

describe("shouldLogActionExecution", () => {
  it("does not report executions in published apps", () => {
    expect(shouldLogActionExecution(APP_MODE.PUBLISHED)).toBe(false);
  });

  it("reports executions in the editor", () => {
    expect(shouldLogActionExecution(APP_MODE.EDIT)).toBe(true);
  });

  it("reports executions when the app mode is unknown", () => {
    expect(shouldLogActionExecution(undefined)).toBe(true);
  });
});

describe("getTestPayloadFromCollectionData", () => {
  beforeAll(() => {
    const store = configureStore()({});

    jest.spyOn(store, "getState").mockReturnValue({});
  });

  it("should return empty string if collectionData is undefined", () => {
    expect(getTestPayloadFromCollectionData(undefined)).toBe("");
  });

  it("should return empty string if testPayload is not present", () => {
    const collectionData: JSCollectionData = {
      isLoading: false,
      config: {
        id: "",
        baseId: "",
        applicationId: "",
        workspaceId: "",
        name: "",
        pageId: "",
        pluginId: "",
        pluginType: PluginType.JS,
        actions: [],
      },
      activeJSActionId: "123",
      data: {},
    };

    expect(getTestPayloadFromCollectionData(collectionData)).toBe("");
  });

  it("should return the test payload string if it exists", () => {
    const collectionData: JSCollectionData = {
      isLoading: false,
      config: {
        id: "",
        baseId: "",
        applicationId: "",
        workspaceId: "",
        name: "",
        pageId: "",
        pluginId: "",
        pluginType: PluginType.JS,
        actions: [],
      },
      activeJSActionId: "123",
      data: {
        testPayload: {
          "123": "test payload",
        },
      },
    };

    expect(getTestPayloadFromCollectionData(collectionData)).toBe(
      "test payload",
    );
  });
});
