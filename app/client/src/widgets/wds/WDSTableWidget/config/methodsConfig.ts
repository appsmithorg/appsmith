import { merge } from "lodash";
import type {
  PropertyUpdates,
  SnipingModeProperty,
} from "WidgetProvider/constants";
import type {
  WidgetQueryConfig,
  WidgetQueryGenerationFormConfig,
} from "WidgetQueryGenerators/types";
import type { WidgetProps } from "widgets/BaseWidget";
import type { DynamicPath } from "utils/DynamicBindingUtils";
import { TableIcon, TableThumbnail } from "appsmith-icons";

export const methodsConfig = {
  getQueryGenerationConfig: () => {
    return {
      select: {
        limit: `100`,
      },
    };
  },
  getPropertyUpdatesForQueryBinding: (
    queryConfig: WidgetQueryConfig,
    _widget: WidgetProps,
    formConfig: WidgetQueryGenerationFormConfig,
  ) => {
    let modify = {};
    const dynamicPropertyPathList: DynamicPath[] = [];

    if (queryConfig.select) {
      modify = merge(modify, {
        tableData: queryConfig.select.data,
        serverSidePaginationEnabled: false,
        enableClientSideSearch: true,
        primaryColumnId: formConfig.primaryColumn,
        isVisibleDownload: false,
      });
    }

    return {
      modify,
      dynamicUpdates: {
        dynamicPropertyPathList,
      },
    };
  },
  getSnipingModeUpdates: (
    propValueMap: SnipingModeProperty,
  ): PropertyUpdates[] => {
    return [
      {
        propertyPath: "tableData",
        propertyValue: propValueMap.data,
        isDynamicPropertyPath: !!propValueMap.isDynamicPropertyPath,
      },
    ];
  },
  getOneClickBindingConnectableWidgetConfig: (widget: WidgetProps) => {
    return {
      widgetBindPath: `${widget.widgetName}.selectedRow`,
      message: `Make sure ${widget.widgetName} is bound to the same data source`,
    };
  },
  IconCmp: TableIcon,
  ThumbnailCmp: TableThumbnail,
};
