import { getTestPayloadFromCollectionData } from "./actionExecutionUtils";
import type { JSCollectionData } from "ee/reducers/entityReducers/jsActionsReducer";
import { PluginType } from "entities/Action";
import configureStore from "redux-mock-store";

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
