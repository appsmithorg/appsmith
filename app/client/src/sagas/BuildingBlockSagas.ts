import type { ImportBuildingBlockToApplicationResponse } from "@appsmith/api/ApplicationApi";
import ApplicationApi from "@appsmith/api/ApplicationApi";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { getCanvasWidgets } from "@appsmith/selectors/entitiesSelector";
import { getCurrentWorkspaceId } from "@appsmith/selectors/selectedWorkspaceSelectors";
import { isAirgapped } from "@appsmith/utils/airgapHelpers";
import { flattenDSL } from "@shared/dsl";
import type { WidgetProps } from "@shared/dsl/src/migrate/types";
import type { FlattenedWidgetProps } from "WidgetProvider/constants";
import { runAction } from "actions/pluginActionActions";
import {
  setCurrentForkingBuildingBlockName,
  showStarterBuildingBlockDatasourcePrompt,
} from "actions/templateActions";
import { pasteWidget } from "actions/widgetActions";
import { selectWidgetInitAction } from "actions/widgetSelectionActions";
import type { ApiResponse } from "api/ApiResponses";
import { STARTER_BUILDING_BLOCKS } from "constants/TemplatesConstants";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import type { WidgetLayoutPositionInfo } from "layoutSystems/anvil/utils/layouts/widgetPositionUtils";
import type { CopiedWidgetData } from "layoutSystems/anvil/utils/paste/types";
import { getWidgetHierarchy } from "layoutSystems/anvil/utils/paste/utils";
import { all, call, delay, put, select, takeEvery } from "redux-saga/effects";
import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import { getCopiedWidgets, saveCopiedWidgets } from "utils/storage";
import { validateResponse } from "./ErrorSagas";
import { postPageAdditionSaga } from "./TemplatesSagas";
import { SelectionRequestType } from "./WidgetSelectUtils";

const isAirgappedInstance = isAirgapped();

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

function* apiCallForForkBuildingBlockToApplication(request: {
  templateId: string;
  activePageId: string;
  applicationId: string;
  workspaceId: string;
  templateName: string;
}) {
  try {
    const response: ApiResponse<ImportBuildingBlockToApplicationResponse> =
      yield call(ApplicationApi.importBuildingBlockToApplication, {
        pageId: request.activePageId,
        templateId: request.templateId,
        applicationId: request.applicationId,
        workspaceId: request.workspaceId,
      });
    const isValid: boolean = yield validateResponse(response);

    yield select(getCanvasWidgets);

    if (isValid) {
      yield saveBuildingBlockWidgetsToStore(response);

      yield put(
        pasteWidget({
          groupWidgets: false,
          mouseLocation: { x: 0, y: 0 },
        }),
      );
      yield call(postPageAdditionSaga, request.applicationId);
      // remove selecting of recently imported widgets
      yield put(selectWidgetInitAction(SelectionRequestType.Empty));

      // run all actions in the building block, if any, to populate the page with data
      if (
        response.data.onPageLoadActions &&
        response.data.onPageLoadActions.length > 0
      ) {
        yield all(
          response.data.onPageLoadActions.map(function* (action) {
            yield put(runAction(action.id));
          }),
        );
      }
      yield put({
        type: ReduxActionTypes.IMPORT_STARTER_TEMPLATE_TO_APPLICATION_SUCCESS,
      });

      // Show datasource prompt after 3 seconds
      yield delay(STARTER_BUILDING_BLOCKS.DATASOURCE_PROMPT_DELAY);
      yield put(setCurrentForkingBuildingBlockName(request.templateName));
      yield put(showStarterBuildingBlockDatasourcePrompt(request.activePageId));
    } else {
      throw new Error("Failed importing starter building block");
    }
  } catch (error) {
    throw error;
  }
}

function* forkStarterBuildingBlockToApplicationSaga(
  action: ReduxAction<{
    templateId: string;
    templateName: string;
  }>,
) {
  const existingCopiedWidgets: unknown = yield call(getCopiedWidgets);
  try {
    const activePageId: string = yield select(getCurrentPageId);
    const applicationId: string = yield select(getCurrentApplicationId);
    const workspaceId: string = yield select(getCurrentWorkspaceId);

    yield call(apiCallForForkBuildingBlockToApplication, {
      templateId: action.payload.templateId,
      activePageId,
      applicationId,
      workspaceId,
      templateName: action.payload.templateName,
    });
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.IMPORT_STARTER_BUILDING_BLOCK_TO_APPLICATION_ERROR,
    });
  }
  if (existingCopiedWidgets) {
    yield call(saveCopiedWidgets, JSON.stringify(existingCopiedWidgets));
  }
}

export default function* watchActionSagas() {
  if (!isAirgappedInstance)
    yield all([
      takeEvery(
        ReduxActionTypes.IMPORT_STARTER_BUILDING_BLOCK_TO_APPLICATION_INIT,
        forkStarterBuildingBlockToApplicationSaga,
      ),
    ]);
}
