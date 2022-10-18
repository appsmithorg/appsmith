import { DataTreeWidget } from "entities/DataTree/dataTreeFactory";

/**
 * PropertyName examples
 * - `TableWidget`: column propertyName
 * - `JSONForm`: field accessor name
 * - `ButtonGroup`: button label name
 * - `MenuButton`: button label name
 * @param widgetEntity
 * @param propertyPath
 * @returns
 */
export const isWidgetPropertyNamePath = (
  widgetEntity: DataTreeWidget,
  fullPath: string,
) => {
  switch (widgetEntity.type) {
    case "TABLE_WIDGET":
    case "TABLE_WIDGET_V2": {
      // TableWidget: Table1.primaryColumns.customColumn1.alias
      const subPaths = fullPath.split(".");
      if (subPaths.length === 4) {
        return subPaths[1] === "primaryColumns" && subPaths[3] === "alias";
      }
      return false;
    }
    case "BUTTON_GROUP_WIDGET": {
      //  buttonGroup: ButtonGroup1.groupButtons.groupButton8osb9mezmx.label
      const subPaths = fullPath.split(".");
      if (subPaths.length === 4) {
        return subPaths[1] === "groupButtons" && subPaths[3] === "label";
      }
      return false;
    }
    case "JSON_FORM_WIDGET": {
      //  JSONForm1.schema.__root_schema__.children.customField1.accessor
      const subPaths = fullPath.split(".");
      if (subPaths.length === 6) {
        return (
          subPaths[1] === "schema" &&
          subPaths[3] === "children" &&
          subPaths[5] === "accessor"
        );
      }
      return false;
    }
    case "MENU_BUTTON_WIDGET": {
      //  MenuButton1.menuItems.menuItemdcoc16pgml.label
      const subPaths = fullPath.split(".");
      if (subPaths.length === 4) {
        return subPaths[1] === "menuItems" && subPaths[3] === "label";
      }
      return false;
    }

    default:
      return false;
  }
};
