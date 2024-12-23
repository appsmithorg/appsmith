import type {
  PropertyUpdates,
  SnipingModeProperty,
} from "WidgetProvider/constants";
import type {
  WidgetQueryConfig,
  WidgetQueryGenerationFormConfig,
} from "WidgetQueryGenerators/types";
import { RadioGroupIcon, SelectThumbnail } from "appsmith-icons";
import type { DynamicPath } from "utils/DynamicBindingUtils";
import type { WidgetProps } from "widgets/BaseWidget";

export const methodsConfig = {
  getSnipingModeUpdates: (
    propValueMap: SnipingModeProperty,
  ): PropertyUpdates[] => {
    return [
      {
        propertyPath: "sourceData",
        propertyValue: propValueMap.data,
        isDynamicPropertyPath: true,
      },
    ];
  },
  getQueryGenerationConfig(widget: WidgetProps) {
    return {
      select: {
        where: `${widget.widgetName}.filterText`,
      },
    };
  },
  getPropertyUpdatesForQueryBinding(
    queryConfig: WidgetQueryConfig,
    widget: WidgetProps,
    formConfig: WidgetQueryGenerationFormConfig,
  ) {
    let modify;

    const dynamicPropertyPathList: DynamicPath[] = [
      ...(widget.dynamicPropertyPathList || []),
    ];

    if (queryConfig.select) {
      modify = {
        sourceData: queryConfig.select.data,
        optionLabel: formConfig.aliases.find((d) => d.name === "label")?.alias,
        optionValue: formConfig.aliases.find((d) => d.name === "value")?.alias,
        defaultOptionValue: "",
        serverSideFiltering: false,
        onFilterUpdate: queryConfig.select.run,
      };

      dynamicPropertyPathList.push({ key: "sourceData" });
    }

    return {
      modify,
      dynamicUpdates: {
        dynamicPropertyPathList,
      },
    };
  },
  IconCmp: RadioGroupIcon,
  ThumbnailCmp: SelectThumbnail,
};
