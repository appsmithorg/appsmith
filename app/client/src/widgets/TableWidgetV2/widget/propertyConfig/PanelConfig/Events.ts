import { TableWidgetProps } from "widgets/TableWidgetV2/constants";
import { get } from "lodash";
import { getBasePropertyPath } from "../../propertyUtils";

export default {
  sectionName: "Events",
  children: [
    {
      propertyName: "onTextChange",
      label: "onTextChange",
      controlType: "ACTION_SELECTOR",
      hidden: (props: TableWidgetProps, propertyPath: string) => {
        const baseProperty = getBasePropertyPath(propertyPath);
        const columnType = get(props, `${baseProperty}.columnType`, "");
        return columnType !== "text";
      },
      dependencies: ["primaryColumns"],
      isJSConvertible: true,
      isBindProperty: true,
      isTriggerProperty: true,
    },
  ],
};
