import type { ImportBuildingBlockToApplicationResponse } from "@appsmith/api/ApplicationApi";
import { flattenDSL } from "@shared/dsl";
import type { WidgetProps } from "@shared/dsl/src/migrate/types";
import type { FlattenedWidgetProps } from "WidgetProvider/constants";
import type { ApiResponse } from "api/ApiResponses";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import type { WidgetLayoutPositionInfo } from "layoutSystems/anvil/utils/layouts/widgetPositionUtils";
import type { CopiedWidgetData } from "layoutSystems/anvil/utils/paste/types";
import { getWidgetHierarchy } from "layoutSystems/anvil/utils/paste/utils";
import { all } from "redux-saga/effects";
import { saveCopiedWidgets } from "utils/storage";

export function* saveBuildingBlockWidgetsToStore(
  response: ApiResponse<ImportBuildingBlockToApplicationResponse>,
) {
  const buildingBlockDsl = JSON.parse(response.data.widgetDsl);
  const buildingBlockWidgets = buildingBlockDsl.children;
  const flattenedBlockWidgets = buildingBlockWidgets.map(
    (widget: WidgetProps) => flattenDSL(widget),
  );

  const widgetsToPasteInCanvas: CopiedWidgetData[] = yield all(
    flattenedBlockWidgets.map((widget: FlattenedWidgetProps, index: number) => {
      const widgetPositionInfo: WidgetLayoutPositionInfo | null = null;
      return {
        hierarchy: getWidgetHierarchy(
          buildingBlockWidgets[index].type,
          buildingBlockWidgets[index].widgetId,
        ),
        list: Object.values(widget)
          .map((obj) => ({ ...obj }))
          .reverse(),
        parentId: MAIN_CONTAINER_WIDGET_ID,
        widgetId: buildingBlockWidgets[index].widgetId,
        widgetPositionInfo,
      };
    }),
  );

  yield saveCopiedWidgets(
    JSON.stringify({
      widgets: widgetsToPasteInCanvas,
      flexLayers: [],
    }),
  );
}
