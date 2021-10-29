import { DataTree, ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import { PluginType } from "entities/Action";
import { createGlobalData } from "workers/evaluate";

describe("Add functions", () => {
  const workerEventMock = jest.fn();
  self.postMessage = workerEventMock;
  self.ALLOW_ASYNC = true;
  it("adds functions correctly", () => {
    const dataTree: DataTree = {
      action1: {
        actionId: "123",
        data: {},
        config: {},
        pluginType: PluginType.API,
        dynamicBindingPathList: [],
        name: "action1",
        bindingPaths: {},
        isLoading: false,
        run: {},
        clear: {},
        responseMeta: { isExecutionSuccess: false },
        ENTITY_TYPE: ENTITY_TYPE.ACTION,
        dependencyMap: {},
        logBlackList: {},
      },
    };
    const dataTreeWithFunctions = createGlobalData(dataTree, {});
    self.REQUEST_ID = "EVAL_TRIGGER";

    // Action run
    const onSuccess = () => "success";
    const onError = () => "failure";
    const actionParams = { param1: "value1" };
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore

    workerEventMock.mockReturnValueOnce({
      data: {
        method: "PROCESS_TRIGGER",
        requestId: "EVAL_TRIGGER",
        success: true,
        data: {
          a: "b",
        },
      },
    });
    expect(
      dataTreeWithFunctions.action1.run(onSuccess, onError, actionParams),
    ).resolves.toBe({ a: "b" });
    expect(workerEventMock).toBeCalledWith({
      type: "PROCESS_TRIGGER",
      requestId: "EVAL_TRIGGER",
      responseData: {
        errors: [],
        subRequestId: "EVAL_TRIGGER_1",
        trigger: {
          type: "RUN_PLUGIN_ACTION",
          payload: {
            actionId: "123",
            params: { param1: "value1" },
          },
        },
      },
    });

    // expect(actionRunResponse.action).toStrictEqual({
    //   type: "PROMISE",
    //   payload: {
    //     executor: [
    //       {
    //         type: "RUN_PLUGIN_ACTION",
    //         payload: {
    //           actionId: "123",
    //           params: { param1: "value1" },
    //         },
    //       },
    //     ],
    //     then: [`{{ function () { return "success"; } }}`],
    //     catch: `{{ function () { return "failure"; } }}`,
    //   },
    // });

    // New syntax for action run with params passed as first argument
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    //   const actionNewRunResponse = dataTreeWithFunctions.action1.run(
    //     actionParams,
    //   );
    //   expect(actionNewRunResponse.action).toStrictEqual({
    //     type: "PROMISE",
    //     payload: {
    //       executor: [
    //         {
    //           type: "RUN_PLUGIN_ACTION",
    //           payload: {
    //             actionId: "123",
    //             params: { param1: "value1" },
    //           },
    //         },
    //       ],
    //       then: [],
    //     },
    //   });
    //
    //   // Action clear
    //   // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //   // @ts-ignore
    //   const actionClearResponse = dataTreeWithFunctions.action1.clear();
    //
    //   expect(actionClearResponse.action).toStrictEqual({
    //     type: "PROMISE",
    //     payload: {
    //       executor: [
    //         {
    //           type: "CLEAR_PLUGIN_ACTION",
    //           payload: {
    //             actionId: "123",
    //           },
    //         },
    //       ],
    //       then: [],
    //     },
    //   });
    //
    //   // Navigate To
    //   const pageNameOrUrl = "www.google.com";
    //   const params = "{ param1: value1 }";
    //   const target = "NEW_WINDOW";
    //   // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //   // @ts-ignore
    //   const navigateToResponse = dataTreeWithFunctions.navigateTo(
    //     pageNameOrUrl,
    //     params,
    //     target,
    //   );
    //   expect(navigateToResponse.action).toStrictEqual({
    //     type: "PROMISE",
    //     payload: {
    //       executor: [
    //         {
    //           type: "NAVIGATE_TO",
    //           payload: {
    //             pageNameOrUrl,
    //             params,
    //             target,
    //           },
    //         },
    //       ],
    //       then: [],
    //     },
    //   });
    //
    //   // Show alert
    //   const message = "Alert message";
    //   const style = "info";
    //   // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //   // @ts-ignore
    //   const showAlertResponse = dataTreeWithFunctions.showAlert(message, style);
    //   expect(showAlertResponse.action).toStrictEqual({
    //     type: "PROMISE",
    //     payload: {
    //       executor: [
    //         {
    //           type: "SHOW_ALERT",
    //           payload: {
    //             message,
    //             style,
    //           },
    //         },
    //       ],
    //       then: [],
    //     },
    //   });
    //
    //   // Show Modal
    //   const modalName = "Modal 1";
    //   // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //   // @ts-ignore
    //   const showModalResponse = dataTreeWithFunctions.showModal(modalName);
    //   expect(showModalResponse.action).toStrictEqual({
    //     type: "PROMISE",
    //     payload: {
    //       executor: [
    //         {
    //           type: "SHOW_MODAL_BY_NAME",
    //           payload: {
    //             modalName,
    //           },
    //         },
    //       ],
    //       then: [],
    //     },
    //   });
    //
    //   // Close Modal
    //   // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //   // @ts-ignore
    //   const closeModalResponse = dataTreeWithFunctions.closeModal(modalName);
    //   expect(closeModalResponse.action).toStrictEqual({
    //     type: "PROMISE",
    //     payload: {
    //       executor: [
    //         {
    //           type: "CLOSE_MODAL",
    //           payload: {
    //             modalName,
    //           },
    //         },
    //       ],
    //       then: [],
    //     },
    //   });
    //
    //   // Store value
    //   const key = "some";
    //   const value = "thing";
    //   const persist = false;
    //   // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //   // @ts-ignore
    //   const storeValueResponse = dataTreeWithFunctions.storeValue(
    //     key,
    //     value,
    //     persist,
    //   );
    //   expect(storeValueResponse.action).toStrictEqual({
    //     type: "PROMISE",
    //     payload: {
    //       executor: [
    //         {
    //           type: "STORE_VALUE",
    //           payload: {
    //             key,
    //             value,
    //             persist,
    //           },
    //         },
    //       ],
    //       then: [],
    //     },
    //   });
    //
    //   // Download
    //   const data = "file";
    //   const name = "downloadedFile.txt";
    //   const type = "text";
    //   // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //   // @ts-ignore
    //   const downloadResponse = dataTreeWithFunctions.download(data, name, type);
    //   expect(downloadResponse.action).toStrictEqual({
    //     type: "PROMISE",
    //     payload: {
    //       executor: [
    //         {
    //           type: "DOWNLOAD",
    //           payload: {
    //             data,
    //             name,
    //             type,
    //           },
    //         },
    //       ],
    //       then: [],
    //     },
    //   });
    //
    //   // copy to clipboard
    //   // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //   // @ts-ignore
    //   const copyToClipboardResponse = dataTreeWithFunctions.copyToClipboard(data);
    //   expect(copyToClipboardResponse.action).toStrictEqual({
    //     type: "PROMISE",
    //     payload: {
    //       executor: [
    //         {
    //           type: "COPY_TO_CLIPBOARD",
    //           payload: {
    //             data,
    //             options: { debug: undefined, format: undefined },
    //           },
    //         },
    //       ],
    //       then: [],
    //     },
    //   });
    //
    //   // reset widget
    //   const widgetName = "widget1";
    //   const resetChildren = true;
    //   // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //   // @ts-ignore
    //   const resetWidgetResponse = dataTreeWithFunctions.resetWidget(
    //     widgetName,
    //     resetChildren,
    //   );
    //   expect(resetWidgetResponse.action).toStrictEqual({
    //     type: "PROMISE",
    //     payload: {
    //       executor: [
    //         {
    //           type: "RESET_WIDGET_META_RECURSIVE_BY_NAME",
    //           payload: {
    //             widgetName,
    //             resetChildren,
    //           },
    //         },
    //       ],
    //       then: [],
    //     },
    //   });
  });
});
