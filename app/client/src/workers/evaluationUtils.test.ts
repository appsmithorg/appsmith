import { addFunctions, getAllPaths } from "./evaluationUtils";
import { DataTree, ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import { PluginType } from "entities/Action";

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
      },
    };
    const dataTreeWithFunctions = addFunctions(dataTree);
    expect(dataTreeWithFunctions.actionPaths).toStrictEqual([
      "action1.run",
      "navigateTo",
      "showAlert",
      "showModal",
      "closeModal",
      "storeValue",
      "download",
      "copyToClipboard",
      "resetWidget",
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
    expect(actionRunResponse).toStrictEqual({
      type: "RUN_ACTION",
      payload: {
        actionId: "123",
        onSuccess: `{{${onSuccess}}}`,
        onError: `{{${onError}}}`,
        params: actionParams,
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
    expect(navigateToResponse).toStrictEqual({
      type: "NAVIGATE_TO",
      payload: {
        pageNameOrUrl,
        params,
        target,
      },
    });

    // Show alert
    const message = "Alert message";
    const style = "info";
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const showAlertResponse = dataTreeWithFunctions.showAlert(message, style);
    expect(showAlertResponse).toStrictEqual({
      type: "SHOW_ALERT",
      payload: {
        message,
        style,
      },
    });

    // Show Modal
    const modalName = "Modal 1";
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const showModalResponse = dataTreeWithFunctions.showModal(modalName);
    expect(showModalResponse).toStrictEqual({
      type: "SHOW_MODAL_BY_NAME",
      payload: {
        modalName,
      },
    });

    // Close Modal
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const closeModalResponse = dataTreeWithFunctions.closeModal(modalName);
    expect(closeModalResponse).toStrictEqual({
      type: "CLOSE_MODAL",
      payload: {
        modalName,
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
    expect(storeValueResponse).toStrictEqual({
      type: "STORE_VALUE",
      payload: {
        key,
        value,
        persist,
      },
    });

    // Download
    const data = "file";
    const name = "downloadedFile.txt";
    const type = "text";
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const downloadResponse = dataTreeWithFunctions.download(data, name, type);
    expect(downloadResponse).toStrictEqual({
      type: "DOWNLOAD",
      payload: {
        data,
        name,
        type,
      },
    });

    // copy to clipboard
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const copyToClipboardResponse = dataTreeWithFunctions.copyToClipboard(data);
    expect(copyToClipboardResponse).toStrictEqual({
      type: "COPY_TO_CLIPBOARD",
      payload: {
        data,
        options: { debug: undefined, format: undefined },
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
    expect(resetWidgetResponse).toStrictEqual({
      type: "RESET_WIDGET_META_RECURSIVE_BY_NAME",
      payload: {
        widgetName,
        resetChildren,
      },
    });
  });
});
