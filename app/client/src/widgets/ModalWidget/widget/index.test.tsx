import ModalWidget from ".";

describe("Modal Widget default Props check", () => {
  it("Check for icon and close button to have dynamicTriggerPathList as onClick key for modal references to update on rename", () => {
    const defaultModalProps = ModalWidget.getDefaults();

    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const modalWidgetCanvasChild: any = {
      type: "CANVAS_WIDGET",
      widgetName: "Canvas1",
      displayName: "Canvas",
      children: [
        {
          type: "TEXT_WIDGET",
          widgetName: "Text1",
          displayName: "Text",
          key: "41j4j00agt",
          widgetId: "TEXT_WIDGET_ID",
          parentId: "CANVAS_WIDGET_ID",
          children: [],
        },
        {
          type: "ICON_BUTTON_WIDGET",
          widgetName: "IconButton1",
          displayName: "Icon button",
          widgetId: "ICON_BUTTON_WIDGET_ID",
          parentId: "CANVAS_WIDGET_ID",
          children: [],
        },
        {
          type: "BUTTON_WIDGET",
          text: "Close",
          widgetName: "Button1",
          key: "8eyy97tgkp",
          widgetId: "BUTTON_WIDGET_ID",
          parentId: "CANVAS_WIDGET_ID",
          children: [],
        },
        {
          type: "BUTTON_WIDGET",
          text: "Confirm",
          widgetName: "Button2",
          key: "8eyy97tgkp",
          widgetId: "BUTTON_WIDGET_ID_2",
          parentId: "CANVAS_WIDGET_ID",
          children: [],
        },
      ],
      widgetId: "CANVAS_WIDGET_ID",
      parentId: "MODAL_WIDGET_ID",
    };

    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const modalWidget: any = {
      type: "MODAL_WIDGET",
      widgetName: "Modal1",
      children: [],
      displayName: "Modal",
      widgetId: "MODAL_WIDGET_ID",
      parentId: "0",
      dynamicHeight: "AUTO_HEIGHT",
    };

    const iconData =
      defaultModalProps.blueprint.view[0].props.blueprint.operations[0].fn(
        modalWidgetCanvasChild,
        {},
        modalWidget,
      );

    const closeButtonData =
      defaultModalProps.blueprint.view[0].props.blueprint.operations[1].fn(
        modalWidgetCanvasChild,
        {},
        modalWidget,
      );

    expect(iconData).not.toBeUndefined();
    expect(iconData![1].propertyName).toContain("dynamicTriggerPathList");
    expect((iconData![1].propertyValue[0] as { key: string }).key).toContain(
      "onClick",
    );

    expect(closeButtonData).not.toBeUndefined();
    expect(closeButtonData![1].propertyName).toContain(
      "dynamicTriggerPathList",
    );
    expect(
      (closeButtonData![1].propertyValue[0] as { key: string }).key,
    ).toContain("onClick");
  });
});
