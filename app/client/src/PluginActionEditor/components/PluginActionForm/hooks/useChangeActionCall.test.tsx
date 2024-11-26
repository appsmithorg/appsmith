import { renderHook } from "@testing-library/react-hooks/dom";
import { useDispatch } from "react-redux";
import { PluginType } from "entities/Action";
import { usePluginActionContext } from "../../../PluginActionContext";
import { changeApi, changeQuery } from "../../../store";
import usePrevious from "utils/hooks/usePrevious";
import { useChangeActionCall } from "./useChangeActionCall";

jest.mock("react-redux", () => ({
  useDispatch: jest.fn(),
}));

jest.mock("../../../store", () => ({
  changeApi: jest.fn(),
  changeQuery: jest.fn(),
}));

jest.mock("../../../PluginActionContext", () => ({
  usePluginActionContext: jest.fn(),
}));

jest.mock("utils/hooks/usePrevious", () => jest.fn());

describe("useChangeActionCall hook", () => {
  const dispatchMock = jest.fn();

  beforeEach(() => {
    (useDispatch as jest.Mock).mockReturnValue(dispatchMock);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should dispatch changeApi when plugin type is API", () => {
    const actionMock = { id: "actionId", baseId: "baseActionId" };
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
      baseId: "baseActionId",
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
      baseQueryId: actionMock.baseId,
      basePageId: actionMock.pageId,
      applicationId: actionMock.applicationId,
      packageId: actionMock.packageId,
      moduleId: actionMock.moduleId,
      workflowId: actionMock.workflowId,
    });
    expect(dispatchMock).toHaveBeenCalledWith(
      changeQuery({
        baseQueryId: actionMock.baseId,
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

  it("should not dispatch any action if the action Id has not changed", () => {
    const actionMock = { id: "actionId", baseId: "baseActionId" };
    const pluginMock = { id: "pluginId", type: PluginType.API };

    // First we mount, so it should be called as previous action id was undefined
    (usePluginActionContext as jest.Mock).mockReturnValueOnce({
      action: actionMock,
      plugin: pluginMock,
    });
    (usePrevious as jest.Mock).mockReturnValueOnce(undefined);
    renderHook(() => useChangeActionCall());
    expect(changeApi).toHaveBeenCalledTimes(1);

    // Now we mock the action object to change but not the id. It should not be called again
    (usePluginActionContext as jest.Mock).mockReturnValueOnce({
      action: { ...actionMock, testId: "test" },
      plugin: pluginMock,
    });
    (usePrevious as jest.Mock).mockReturnValueOnce("actionId");
    renderHook(() => useChangeActionCall());
    expect(changeApi).toHaveBeenCalledTimes(1);

    // Now we change the action id, so it will be called the second time
    (usePluginActionContext as jest.Mock).mockReturnValueOnce({
      action: { id: "actionId2", testId: "test" },
      plugin: pluginMock,
    });
    (usePrevious as jest.Mock).mockReturnValueOnce("actionId");
    renderHook(() => useChangeActionCall());
    expect(changeApi).toHaveBeenCalledTimes(2);
  });
});
