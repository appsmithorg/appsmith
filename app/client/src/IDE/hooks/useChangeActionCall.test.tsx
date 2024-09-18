import { renderHook } from "@testing-library/react-hooks/dom";
import { useChangeActionCall } from "./useChangeActionCall";
import { useDispatch } from "react-redux";
import { PluginType } from "entities/Action";
import { usePluginActionContext } from "PluginActionEditor";
import { changeApi } from "actions/apiPaneActions";
import { changeQuery } from "actions/queryPaneActions";

jest.mock("react-redux", () => ({
  useDispatch: jest.fn(),
}));

jest.mock("actions/apiPaneActions", () => ({
  changeApi: jest.fn(),
}));

jest.mock("actions/queryPaneActions", () => ({
  changeQuery: jest.fn(),
}));

jest.mock("PluginActionEditor", () => ({
  usePluginActionContext: jest.fn(),
}));

describe("useChangeActionCall hook", () => {
  const dispatchMock = jest.fn();

  beforeEach(() => {
    (useDispatch as jest.Mock).mockReturnValue(dispatchMock);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should dispatch changeApi when plugin type is API", () => {
    const actionMock = { id: "actionId" };
    const pluginMock = { id: "pluginId", type: PluginType.API };

    // Mock the return values of usePluginActionContext
    (usePluginActionContext as jest.Mock).mockReturnValue({
      action: actionMock,
      plugin: pluginMock,
    });

    // Render the hook
    renderHook(() => useChangeActionCall());

    // Expect changeApi to be called with the correct parameters
    expect(changeApi).toHaveBeenCalledWith(actionMock.id, false);
    expect(dispatchMock).toHaveBeenCalledWith(changeApi(actionMock.id, false));
  });

  it("should dispatch changeQuery when plugin type is not API", () => {
    const actionMock = {
      id: "actionId",
      pageId: "pageId",
      applicationId: "applicationId",
      packageId: "packageId",
      moduleId: "moduleId",
      workflowId: "workflowId",
    };
    const pluginMock = { id: "pluginId", type: "OTHER_PLUGIN_TYPE" };

    // Mock the return values of usePluginActionContext
    (usePluginActionContext as jest.Mock).mockReturnValue({
      action: actionMock,
      plugin: pluginMock,
    });

    // Render the hook
    renderHook(() => useChangeActionCall());

    // Expect changeQuery to be called with the correct parameters
    expect(changeQuery).toHaveBeenCalledWith({
      baseQueryId: actionMock.id,
      basePageId: actionMock.pageId,
      applicationId: actionMock.applicationId,
      packageId: actionMock.packageId,
      moduleId: actionMock.moduleId,
      workflowId: actionMock.workflowId,
    });
    expect(dispatchMock).toHaveBeenCalledWith(
      changeQuery({
        baseQueryId: actionMock.id,
        basePageId: actionMock.pageId,
        applicationId: actionMock.applicationId,
        packageId: actionMock.packageId,
        moduleId: actionMock.moduleId,
        workflowId: actionMock.workflowId,
      }),
    );
  });

  it("should not dispatch any action if plugin id or action is not available", () => {
    // Mock the return values of usePluginActionContext without plugin or action
    (usePluginActionContext as jest.Mock).mockReturnValue({
      action: null,
      plugin: { id: null, type: PluginType.API },
    });

    // Render the hook
    renderHook(() => useChangeActionCall());

    // Expect no action to be dispatched
    expect(dispatchMock).not.toHaveBeenCalled();
  });
});
