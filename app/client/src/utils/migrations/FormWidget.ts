import { WidgetProps } from "widgets/BaseWidget";
import { ContainerWidgetProps } from "widgets/ContainerWidget";
import { cloneDeep } from "lodash";

export const formWidgetButtonWidgetMigrations = (
  currentDSL: ContainerWidgetProps<WidgetProps>,
) => {
  currentDSL.children = currentDSL.children?.map((_child: WidgetProps) => {
    let child = cloneDeep(_child);

    if (child.type === "FORM_WIDGET") {
      const formName = child.widgetName;
      // first children is canvas which will have other widgets as children
      child.children.map((canvas: WidgetProps) => {
        canvas.children.map((formChildWidgets: WidgetProps) => {
          if (formChildWidgets.type === "FORM_BUTTON_WIDGET") {
            // change fields : type
            formChildWidgets.type = "BUTTON_WIDGET";
            // add field : isDisabled, onClick
            formChildWidgets.isDisabled = false;
            if (formChildWidgets.resetFormOnClick) {
              formChildWidgets.onClick = `{{resetWidget("${formName}", true)}}`;
            }
            // remove fields from FormBtn : resetFormOnClick, disabledWhenInvalid
            delete formChildWidgets.resetFormOnClick;
            delete formChildWidgets.disabledWhenInvalid;
          }
        });
      });
    } else if (child.children && child.children.length > 0) {
      child = formWidgetButtonWidgetMigrations(child);
    }
    return child;
  });
  return currentDSL;
};
