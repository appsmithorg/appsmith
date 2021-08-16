import { getAllPaths } from "./evaluationUtils";
import { DataTree, ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import { PluginType } from "entities/Action";
import { enhanceDataTreeWithFunctions } from "./Actions";

describe("getAllPaths", () => {
  it("getsAllPaths", () => {
    const myTree = {
      WidgetName: {
        1: "yo",
        name: "WidgetName",
        objectProperty: {
          childObjectProperty: [
            "1",
            1,
            {
              key: "value",
              2: 1,
            },
            ["1", "2"],
          ],
        },
      },
    };
    const result = {
      WidgetName: true,
      "WidgetName.1": true,
      "WidgetName.name": true,
      "WidgetName.objectProperty": true,
      "WidgetName.objectProperty.childObjectProperty": true,
      "WidgetName.objectProperty.childObjectProperty[0]": true,
      "WidgetName.objectProperty.childObjectProperty[1]": true,
      "WidgetName.objectProperty.childObjectProperty[2]": true,
      "WidgetName.objectProperty.childObjectProperty[2].key": true,
      "WidgetName.objectProperty.childObjectProperty[2].2": true,
      "WidgetName.objectProperty.childObjectProperty[3]": true,
      "WidgetName.objectProperty.childObjectProperty[3][0]": true,
      "WidgetName.objectProperty.childObjectProperty[3][1]": true,
    };

    const actual = getAllPaths(myTree);
    expect(actual).toStrictEqual(result);
  });
});

describe("Add functions", () => {
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
        responseMeta: { isExecutionSuccess: false },
        ENTITY_TYPE: ENTITY_TYPE.ACTION,
        dependencyMap: {},
        logBlackList: {},
      },
    };
    const dataTreeWithFunctions = enhanceDataTreeWithFunctions(dataTree);
    expect(window.actionPaths).toStrictEqual([
      "navigateTo",
      "showAlert",
      "showModal",
      "closeModal",
      "storeValue",
      "download",
      "copyToClipboard",
      "resetWidget",
      "action1.run",
    ]);

    // Action run
    const onSuccess = "() => {successRun()}";
    const onError = "() => {failureRun()}";
    const actionParams = "{ param1: value1 }";
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const actionRunResponse = dataTreeWithFunctions.action1.run(
      onSuccess,
      onError,
      actionParams,
    );
    expect(actionRunResponse.action).toStrictEqual({
      type: "PROMISE",
      payload: {
        executor: [
          {
            type: "PLUGIN_ACTION",
            payload: {
              actionId: "123",
              params: "{ param1: value1 }",
            },
          },
        ],
        then: ["{{ new Promise(() => {successRun()}) }}"],
        catch: "{{ new Promise(() => {failureRun()}) }}",
      },
    });

    // Navigate To
    const pageNameOrUrl = "www.google.com";
    const params = "{ param1: value1 }";
    const target = "NEW_WINDOW";
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const navigateToResponse = dataTreeWithFunctions.navigateTo(
      pageNameOrUrl,
      params,
      target,
    );
    expect(navigateToResponse.action).toStrictEqual({
      type: "PROMISE",
      payload: {
        executor: [
          {
            type: "NAVIGATE_TO",
            payload: {
              pageNameOrUrl,
              params,
              target,
            },
          },
        ],
        then: [],
      },
    });

    // Show alert
    const message = "Alert message";
    const style = "info";
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const showAlertResponse = dataTreeWithFunctions.showAlert(message, style);
    expect(showAlertResponse.action).toStrictEqual({
      type: "PROMISE",
      payload: {
        executor: [
          {
            type: "SHOW_ALERT",
            payload: {
              message,
              style,
            },
          },
        ],
        then: [],
      },
    });

    // Show Modal
    const modalName = "Modal 1";
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const showModalResponse = dataTreeWithFunctions.showModal(modalName);
    expect(showModalResponse.action).toStrictEqual({
      type: "PROMISE",
      payload: {
        executor: [
          {
            type: "SHOW_MODAL_BY_NAME",
            payload: {
              modalName,
            },
          },
        ],
        then: [],
      },
    });

    // Close Modal
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const closeModalResponse = dataTreeWithFunctions.closeModal(modalName);
    expect(closeModalResponse.action).toStrictEqual({
      type: "PROMISE",
      payload: {
        executor: [
          {
            type: "CLOSE_MODAL",
            payload: {
              modalName,
            },
          },
        ],
        then: [],
      },
    });

    // Store value
    const key = "some";
    const value = "thing";
    const persist = false;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const storeValueResponse = dataTreeWithFunctions.storeValue(
      key,
      value,
      persist,
    );
    expect(storeValueResponse.action).toStrictEqual({
      type: "PROMISE",
      payload: {
        executor: [
          {
            type: "STORE_VALUE",
            payload: {
              key,
              value,
              persist,
            },
          },
        ],
        then: [],
      },
    });

    // Download
    const data = "file";
    const name = "downloadedFile.txt";
    const type = "text";
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const downloadResponse = dataTreeWithFunctions.download(data, name, type);
    expect(downloadResponse.action).toStrictEqual({
      type: "PROMISE",
      payload: {
        executor: [
          {
            type: "DOWNLOAD",
            payload: {
              data,
              name,
              type,
            },
          },
        ],
        then: [],
      },
    });

    // copy to clipboard
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const copyToClipboardResponse = dataTreeWithFunctions.copyToClipboard(data);
    expect(copyToClipboardResponse.action).toStrictEqual({
      type: "PROMISE",
      payload: {
        executor: [
          {
            type: "COPY_TO_CLIPBOARD",
            payload: {
              data,
              options: { debug: undefined, format: undefined },
            },
          },
        ],
        then: [],
      },
    });

    // reset widget
    const widgetName = "widget1";
    const resetChildren = true;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const resetWidgetResponse = dataTreeWithFunctions.resetWidget(
      widgetName,
      resetChildren,
    );
    expect(resetWidgetResponse.action).toStrictEqual({
      type: "PROMISE",
      payload: {
        executor: [
          {
            type: "RESET_WIDGET_META_RECURSIVE_BY_NAME",
            payload: {
              widgetName,
              resetChildren,
            },
          },
        ],
        then: [],
      },
    });
  });
});
