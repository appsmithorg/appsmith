import {
  ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionType,
  ReduxActionTypes,
  WidgetReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { updateAndSaveLayout, WidgetResize } from "actions/pageActions";
import {
  CanvasWidgetsReduxState,
  FlattenedWidgetProps,
} from "reducers/entityReducers/canvasWidgetsReducer";
import { getWidget, getWidgets, getWidgetsMeta } from "./selectors";
import {
  actionChannel,
  all,
  call,
  fork,
  put,
  select,
  take,
  takeEvery,
  takeLatest,
  takeLeading,
} from "redux-saga/effects";
import { convertToString } from "utils/AppsmithUtils";
import {
  batchUpdateWidgetProperty,
  DeleteWidgetPropertyPayload,
  SetWidgetDynamicPropertyPayload,
  updateMultipleWidgetPropertiesAction,
  UpdateWidgetPropertyPayload,
  UpdateWidgetPropertyRequestPayload,
  updateWidgetPropertyRequest,
} from "actions/controlActions";
import {
  DynamicPath,
  getEntityDynamicBindingPathList,
  getWidgetDynamicPropertyPathList,
  getWidgetDynamicTriggerPathList,
  isChildPropertyPath,
  isDynamicValue,
  isPathADynamicBinding,
  isPathDynamicTrigger,
} from "utils/DynamicBindingUtils";
import { WidgetProps } from "widgets/BaseWidget";
import _, {
  cloneDeep,
  each,
  filter,
  includes,
  isString,
  map,
  max,
  min,
  set,
  sortBy,
  uniq,
} from "lodash";
import Collisions from "collisions";
import { ALIGN_TYPE } from "actions/widgetActions";

import WidgetFactory from "utils/WidgetFactory";
import { resetWidgetMetaProperty } from "actions/metaActions";
import {
  GridDefaults,
  MAIN_CONTAINER_WIDGET_ID,
  RenderModes,
} from "constants/WidgetConstants";
import { getCopiedWidgets, saveCopiedWidgets } from "utils/storage";
import { generateReactKey } from "utils/generators";
import AnalyticsUtil from "utils/AnalyticsUtil";
import log from "loglevel";
import { navigateToCanvas } from "pages/Editor/Explorer/Widgets/utils";
import {
  getCurrentPageId,
  getContainerWidgetSpacesSelector,
} from "selectors/editorSelectors";
import { selectWidgetInitAction } from "actions/widgetSelectionActions";

import { getDataTree } from "selectors/dataTreeSelectors";
import { validateProperty } from "./EvaluationsSaga";
import { Toaster, Variant } from "design-system-old";
import { ColumnProperties } from "widgets/TableWidget/component/Constants";
import {
  getAllPathsFromPropertyConfig,
  nextAvailableRowInContainer,
} from "entities/Widget/utils";
import { getAllPaths } from "@appsmith/workers/Evaluation/evaluationUtils";
import {
  createMessage,
  ERROR_WIDGET_COPY_NO_WIDGET_SELECTED,
  ERROR_WIDGET_COPY_NOT_ALLOWED,
  ERROR_WIDGET_CUT_NO_WIDGET_SELECTED,
  WIDGET_COPY,
  WIDGET_CUT,
  ERROR_WIDGET_CUT_NOT_ALLOWED,
} from "@appsmith/constants/messages";

import {
  changeIdsOfPastePositions,
  CopiedWidgetGroup,
  createSelectedWidgetsAsCopiedWidgets,
  createWidgetCopy,
  doesTriggerPathsContainPropertyPath,
  filterOutSelectedWidgets,
  getBoundariesFromSelectedWidgets,
  getBoundaryWidgetsFromCopiedGroups,
  getCanvasIdForContainer,
  getContainerIdForCanvas,
  getDefaultCanvas,
  getMousePositions,
  getNewPositionsForCopiedWidgets,
  getNextWidgetName,
  getOccupiedSpacesFromProps,
  getParentWidgetIdForGrouping,
  getParentWidgetIdForPasting,
  getPastePositionMapFromMousePointer,
  getReflowedPositions,
  getSelectedWidgetWhenPasting,
  getSnappedGrid,
  getValueFromTree,
  getVerifiedSelectedWidgets,
  getVerticallyAdjustedPositions,
  getWidgetDescendantToReset,
  groupWidgetsIntoContainer,
  handleSpecificCasesWhilePasting,
  isDropTarget,
  isSelectedWidgetsColliding,
  mergeDynamicPropertyPaths,
  NewPastePositionVariables,
  purgeOrphanedDynamicPaths,
  WIDGET_PASTE_PADDING,
} from "./WidgetOperationUtils";
import { getSelectedWidgets } from "selectors/ui";
import { widgetSelectionSagas } from "./WidgetSelectionSagas";
import { DataTree } from "entities/DataTree/dataTreeFactory";
import { getCanvasSizeAfterWidgetMove } from "./CanvasSagas/DraggingCanvasSagas";
import widgetAdditionSagas from "./WidgetAdditionSagas";
import widgetDeletionSagas from "./WidgetDeletionSagas";
import { getReflow } from "selectors/widgetReflowSelectors";
import { widgetReflow } from "reducers/uiReducers/reflowReducer";
import { stopReflowAction } from "actions/reflowActions";
import {
  collisionCheckPostReflow,
  getBottomRowAfterReflow,
} from "utils/reflowHookUtils";
import {
  GridProps,
  PrevReflowState,
  ReflowDirection,
  SpaceMap,
} from "reflow/reflowTypes";
import { WidgetSpace } from "constants/CanvasEditorConstants";
import { reflow } from "reflow";
import { getBottomMostRow } from "reflow/reflowUtils";
import { flashElementsById } from "utils/helpers";
import { getSlidingArenaName } from "constants/componentClassNameConstants";
import { builderURL } from "RouteBuilder";
import history from "utils/history";
import { generateAutoHeightLayoutTreeAction } from "actions/autoHeightActions";
import { traverseTreeAndExecuteBlueprintChildOperations } from "./WidgetBlueprintSagas";
import { MetaState } from "reducers/entityReducers/metaReducer";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";

type Wall = {
  _max_x: number;
  _max_y: number;
  _min_x: number;
  _min_y: number;
  [key: string]: any;
};
export function* handleAlignWidgets(action: ReduxAction<ALIGN_TYPE>) {
  const allWidgets: { [widgetId: string]: FlattenedWidgetProps } = yield select(
    getWidgets,
  );
  const selectedWidgets: string[] = yield select(getSelectedWidgets);
  // you can now use the alignment operation on only one
  const isMultipleWidgetsSelected = selectedWidgets.length > 0;
  // Create a Result object for collecting information about the collisions
  if (selectedWidgets.length) {
    // group inward and downward
    if (isMultipleWidgetsSelected && action.payload === ALIGN_TYPE.B) {
      const selectedWidgetBottomColumn = max(
        selectedWidgets.map((each) => allWidgets[each].bottomRow),
      ) as number;
      const sortWidgets = sortBy(
        selectedWidgets.map((each) => allWidgets[each]),
        "bottomRow",
        "topRow",
      ).reverse();
      let i = 0;
      const system = new Collisions();
      while (i < sortWidgets.length) {
        const widgetKey = sortWidgets[i].widgetId;
        let calculationSelectedWidgetRightColumn = selectedWidgetBottomColumn;
        const { leftColumn, rightColumn } = sortWidgets[i];
        // maximum face
        const wall = system.createPolygon(
          0,
          0,
          [
            [leftColumn, sortWidgets[i].bottomRow],
            [rightColumn, selectedWidgetBottomColumn],
            [leftColumn, selectedWidgetBottomColumn],
            [rightColumn, sortWidgets[i].bottomRow],
          ],
          0,
          1,
          1,
          -0.1,
        );

        system.update();
        const potentials: [Wall] = wall.potentials();
        if (potentials.length) {
          calculationSelectedWidgetRightColumn = min(
            potentials.map((v) => v._min_y),
          ) as number;
        }
        wall.remove();
        const newWall = system.createPolygon(
          0,
          0,
          [
            [
              leftColumn,
              sortWidgets[i].topRow +
                calculationSelectedWidgetRightColumn -
                sortWidgets[i].bottomRow,
            ],
            [rightColumn, calculationSelectedWidgetRightColumn],
            [leftColumn, calculationSelectedWidgetRightColumn],
            [
              rightColumn,
              sortWidgets[i].topRow +
                calculationSelectedWidgetRightColumn -
                sortWidgets[i].bottomRow,
            ],
          ],
          0,
          1,
          1,
          -0.1,
        );
        newWall.widget = sortWidgets[i];
        system.update();

        yield call(
          updateWidgetPropertySaga,
          updateWidgetPropertyRequest(
            widgetKey,
            "bottomRow",
            calculationSelectedWidgetRightColumn,
          ),
        );
        yield call(
          updateWidgetPropertySaga,
          updateWidgetPropertyRequest(
            widgetKey,
            "topRow",
            sortWidgets[i].topRow +
              (calculationSelectedWidgetRightColumn - sortWidgets[i].bottomRow),
          ),
        );
        i++;
      }
    }

    // align right;
    if (isMultipleWidgetsSelected && action.payload === ALIGN_TYPE.R) {
      const selectedWidgetRightColumn = max(
        selectedWidgets.map((each) => allWidgets[each].rightColumn),
      ) as number;
      const sortWidgets = sortBy(
        selectedWidgets.map((each) => allWidgets[each]),
        "rightColumn",
        "topRow",
      ).reverse();
      // const
      let i = 0;
      const system = new Collisions();
      while (i < sortWidgets.length) {
        const widgetKey = sortWidgets[i].widgetId;
        let calculationSelectedWidgetRightColumn = selectedWidgetRightColumn;
        const { bottomRow, topRow } = sortWidgets[i];
        const wall = system.createPolygon(
          0,
          0,
          [
            [sortWidgets[i].rightColumn, topRow],
            [sortWidgets[i].rightColumn, bottomRow],
            [selectedWidgetRightColumn, bottomRow],
            [selectedWidgetRightColumn, topRow],
          ],
          0,
          1,
          1,
          -0.1,
        );

        system.update();
        const potentials: [Wall] = wall.potentials();
        if (potentials.length) {
          calculationSelectedWidgetRightColumn = min(
            potentials.map((v) => v._min_x),
          ) as number;
        }
        wall.remove();
        const newWall = system.createPolygon(
          0,
          0,
          [
            [
              sortWidgets[i].leftColumn +
                calculationSelectedWidgetRightColumn -
                sortWidgets[i].rightColumn,
              topRow,
            ],
            [
              sortWidgets[i].leftColumn +
                calculationSelectedWidgetRightColumn -
                sortWidgets[i].rightColumn,
              bottomRow,
            ],
            [calculationSelectedWidgetRightColumn, bottomRow],
            [calculationSelectedWidgetRightColumn, topRow],
          ],
          0,
          1,
          1,
          -0.1,
        );
        newWall.widget = sortWidgets[i];
        system.update();
        yield call(
          updateWidgetPropertySaga,
          updateWidgetPropertyRequest(
            widgetKey,
            "rightColumn",
            calculationSelectedWidgetRightColumn,
          ),
        );
        yield call(
          updateWidgetPropertySaga,
          updateWidgetPropertyRequest(
            widgetKey,
            "leftColumn",
            sortWidgets[i].leftColumn +
              (calculationSelectedWidgetRightColumn -
                sortWidgets[i].rightColumn),
          ),
        );
        i++;
      }
    }

    // align left;
    if (isMultipleWidgetsSelected && action.payload === ALIGN_TYPE.L) {
      const selectedWidgetLeftColumn = min(
        selectedWidgets.map((each) => allWidgets[each].leftColumn),
      ) as number;
      const sortWidgets = sortBy(
        selectedWidgets.map((each) => allWidgets[each]),
        "leftColumn",
        "topRow",
      );
      // const
      let i = 0;
      const system = new Collisions();
      while (i < sortWidgets.length) {
        const widgetKey = sortWidgets[i].widgetId;
        let calculationSelectedWidgetLeftColumn = selectedWidgetLeftColumn;
        const { bottomRow, topRow } = sortWidgets[i];
        const wall = system.createPolygon(
          0,
          0,
          [
            [0, topRow],
            [0, bottomRow],
            [sortWidgets[i].leftColumn, bottomRow],
            [sortWidgets[i].leftColumn, topRow],
          ],
          0,
          1,
          1,
          -0.1,
        );

        system.update();
        const potentials: [Wall] = wall.potentials();

        if (potentials.length) {
          calculationSelectedWidgetLeftColumn = max(
            potentials.map((v) => v._max_x),
          ) as number;
        }
        wall.remove();
        const newWall = system.createPolygon(
          0,
          0,
          [
            [calculationSelectedWidgetLeftColumn, topRow],
            [calculationSelectedWidgetLeftColumn, bottomRow],
            [
              sortWidgets[i].rightColumn -
                (sortWidgets[i].leftColumn -
                  calculationSelectedWidgetLeftColumn),
              bottomRow,
            ],
            [
              sortWidgets[i].rightColumn -
                (sortWidgets[i].leftColumn -
                  calculationSelectedWidgetLeftColumn),
              topRow,
            ],
          ],
          0,
          1,
          1,
          -0.1,
        );
        newWall.widget = sortWidgets[i];
        system.update();

        //collision detection
        yield call(
          updateWidgetPropertySaga,
          updateWidgetPropertyRequest(
            widgetKey,
            "leftColumn",
            calculationSelectedWidgetLeftColumn,
          ),
        );
        yield call(
          updateWidgetPropertySaga,
          updateWidgetPropertyRequest(
            widgetKey,
            "rightColumn",
            sortWidgets[i].rightColumn -
              (sortWidgets[i].leftColumn - calculationSelectedWidgetLeftColumn),
          ),
        );
        i++;
      }
    }

    //align top
    if (isMultipleWidgetsSelected && action.payload === ALIGN_TYPE.T) {
      const selectedWidgetTopColumn = min(
        selectedWidgets.map((each) => allWidgets[each].topRow),
      ) as number;
      const sortWidgets = sortBy(
        selectedWidgets.map((each) => allWidgets[each]),
        "topRow",
        "leftColumn",
      );
      let i = 0;
      const system = new Collisions();
      while (i < sortWidgets.length) {
        const widgetKey = sortWidgets[i].widgetId;
        let calculationSelectedWidgetLeftColumn = selectedWidgetTopColumn;
        const { leftColumn, rightColumn } = sortWidgets[i];

        // 向上方向进行碰撞检测
        const wall = system.createPolygon(
          0,
          0,
          [
            [leftColumn, calculationSelectedWidgetLeftColumn],
            [leftColumn, sortWidgets[i].topRow],
            [rightColumn, sortWidgets[i].topRow],
            [rightColumn, calculationSelectedWidgetLeftColumn],
          ],
          0,
          1,
          1,
          -0.1,
        );

        system.update();
        const potentials: [Wall] = wall.potentials();

        if (potentials.length) {
          // get the most appropriate y coordinate
          calculationSelectedWidgetLeftColumn = max(
            potentials.map((v) => v._max_y),
          ) as number;
        }

        wall.remove();

        // the real wall
        const newWall = system.createPolygon(
          0,
          0,
          [
            [leftColumn, calculationSelectedWidgetLeftColumn],
            [
              leftColumn,
              sortWidgets[i].bottomRow -
                (sortWidgets[i].topRow - calculationSelectedWidgetLeftColumn),
            ],
            [
              rightColumn,
              sortWidgets[i].bottomRow -
                (sortWidgets[i].topRow - calculationSelectedWidgetLeftColumn),
            ],
            [rightColumn, calculationSelectedWidgetLeftColumn],
          ],
          0,
          1,
          1,
          -0.1,
        );
        newWall.widget = sortWidgets[i];
        system.update();

        //collision detection
        yield call(
          updateWidgetPropertySaga,
          updateWidgetPropertyRequest(
            widgetKey,
            "topRow",
            calculationSelectedWidgetLeftColumn,
          ),
        );
        yield call(
          updateWidgetPropertySaga,
          updateWidgetPropertyRequest(
            widgetKey,
            "bottomRow",
            sortWidgets[i].bottomRow -
              (sortWidgets[i].topRow - calculationSelectedWidgetLeftColumn),
          ),
        );
        i++;
      }
    }

    // horizontally
    if (isMultipleWidgetsSelected && action.payload === ALIGN_TYPE.C) {
      const selectedWidgetLeftColumn = min(
        selectedWidgets.map((each) => allWidgets[each].leftColumn),
      ) as number;
      const selectedWidgetRightColumn = max(
        selectedWidgets.map((each) => allWidgets[each].rightColumn),
      ) as number;
      const system = new Collisions();
      const wallMap = new Map();
      selectedWidgets.forEach((v) => {
        const { bottomRow, leftColumn, rightColumn, topRow } = allWidgets[v];
        const xOffset =
          (selectedWidgetRightColumn -
            selectedWidgetLeftColumn -
            (rightColumn - leftColumn)) /
          2;
        const wall = system.createPolygon(
          0,
          0,
          [
            [selectedWidgetLeftColumn + xOffset, topRow],
            [selectedWidgetLeftColumn + xOffset, bottomRow],
            [
              selectedWidgetRightColumn -
                (leftColumn - (selectedWidgetLeftColumn + xOffset)),
              bottomRow,
            ],
            [
              selectedWidgetRightColumn -
                (leftColumn - (selectedWidgetLeftColumn + xOffset)),
              topRow,
            ],
          ],
          0,
          1,
          1,
          -0.1,
        );
        wall.widget = allWidgets[v];
        wallMap.set(v, wall);
      });
      system.update();

      const initSelectedWidgetLeftColumn = selectedWidgetLeftColumn;
      const initSelectedWidgetRightColumn = selectedWidgetRightColumn;
      for (const [, v] of wallMap) {
        let leftEdgeBorder = initSelectedWidgetLeftColumn;
        let rightEdgeBorder = initSelectedWidgetRightColumn;
        const dependSet = new Set(v.potentials());
        dependSet.forEach((item: any) => {
          wallMap.delete(item.widget.widgetId);
          item.potentials().forEach((wall: Wall) => {
            dependSet.add(wall);
          });
        });
        dependSet.add(v);

        const selectedWidgets = map(
          [...dependSet],
          (v: any) => v.widget.widgetId,
        );
        const selectedWidgetLeftColumn = min(
          selectedWidgets.map((each) => allWidgets[each].leftColumn),
        ) as number;
        const selectedWidgetTopColumn = min(
          selectedWidgets.map((each) => allWidgets[each].topRow),
        ) as number;
        const selectedWidgetBottomColumn = max(
          selectedWidgets.map((each) => allWidgets[each].bottomRow),
        ) as number;
        const selectedWidgetRightColumn = max(
          selectedWidgets.map((each) => allWidgets[each].rightColumn),
        ) as number;

        each(
          map(selectedWidgets, (each) => allWidgets[each]),
          (v, k) => {
            if (
              !includes(selectedWidgets, k) &&
              v.widgetId !== "0" &&
              v.bottomRow > selectedWidgetTopColumn &&
              v.topRow < selectedWidgetBottomColumn
            ) {
              if (
                v.rightColumn <= selectedWidgetLeftColumn &&
                v.rightColumn > leftEdgeBorder
              ) {
                leftEdgeBorder = v.rightColumn;
              }
              if (
                v.leftColumn >= selectedWidgetRightColumn &&
                v.leftColumn < rightEdgeBorder
              ) {
                rightEdgeBorder = v.leftColumn;
              }
            }
          },
        );
        const moveOffset =
          (rightEdgeBorder -
            leftEdgeBorder -
            (selectedWidgetRightColumn - selectedWidgetLeftColumn)) /
          2;

        let i = 0;

        while (i < selectedWidgets.length) {
          const widgetKey = selectedWidgets[i];
          yield call(
            updateWidgetPropertySaga,
            updateWidgetPropertyRequest(
              widgetKey,
              "leftColumn",
              allWidgets[widgetKey].leftColumn -
                (selectedWidgetLeftColumn - (leftEdgeBorder + moveOffset)),
            ),
          );
          yield call(
            updateWidgetPropertySaga,
            updateWidgetPropertyRequest(
              widgetKey,
              "rightColumn",
              allWidgets[widgetKey].rightColumn -
                (selectedWidgetLeftColumn - (leftEdgeBorder + moveOffset)),
            ),
          );
          i++;
        }
      }
      // console.log(system.potentials(), 'potentials');
    }

    // center vertically
    if (isMultipleWidgetsSelected && action.payload === ALIGN_TYPE.VC) {
      const selectedWidgetTopColumn = min(
        selectedWidgets.map((each) => allWidgets[each].topRow),
      ) as number;
      const selectedWidgetBottomColumn = max(
        selectedWidgets.map((each) => allWidgets[each].bottomRow),
      ) as number;
      const system = new Collisions();
      const wallMap = new Map();
      selectedWidgets.forEach((v) => {
        const { bottomRow, leftColumn, rightColumn, topRow } = allWidgets[v];

        const yOffset =
          (selectedWidgetBottomColumn -
            selectedWidgetTopColumn -
            (topRow - bottomRow)) /
          2;
        const wall = system.createPolygon(
          0,
          0,
          [
            [leftColumn, selectedWidgetTopColumn + yOffset],
            [
              leftColumn,
              selectedWidgetBottomColumn -
                (topRow - (selectedWidgetTopColumn + yOffset)),
            ],
            [rightColumn, bottomRow],
            [
              rightColumn,
              selectedWidgetBottomColumn -
                (topRow - (selectedWidgetTopColumn + yOffset)),
            ],
          ],
          0,
          1,
          1,
          -0.1,
        );
        wall.widget = allWidgets[v];
        wallMap.set(v, wall);
      });
      system.update();

      const initSelectedWidgetTopColumn = selectedWidgetTopColumn;
      const initSelectedWidgetBottomColumn = selectedWidgetBottomColumn;
      for (const [, v] of wallMap) {
        let topEdgeBorder = initSelectedWidgetTopColumn;
        let bottomEdgeBorder = initSelectedWidgetBottomColumn;
        const dependSet = new Set(v.potentials());
        dependSet.forEach((item: any) => {
          wallMap.delete(item.widget.widgetId);
          item.potentials().forEach((wall: Wall) => {
            dependSet.add(wall);
          });
        });
        dependSet.add(v);

        const selectedWidgets = map(
          [...dependSet],
          (v: any) => v.widget.widgetId,
        );
        const selectedWidgetLeftColumn = min(
          selectedWidgets.map((each) => allWidgets[each].leftColumn),
        ) as number;
        const selectedWidgetTopColumn = min(
          selectedWidgets.map((each) => allWidgets[each].topRow),
        ) as number;
        const selectedWidgetBottomColumn = max(
          selectedWidgets.map((each) => allWidgets[each].bottomRow),
        ) as number;
        const selectedWidgetRightColumn = max(
          selectedWidgets.map((each) => allWidgets[each].rightColumn),
        ) as number;

        each(
          map(selectedWidgets, (each) => allWidgets[each]),
          (v, k) => {
            if (
              !includes(selectedWidgets, k) &&
              v.widgetId !== "0" &&
              v.leftColumn > selectedWidgetLeftColumn &&
              v.rightColumn < selectedWidgetRightColumn
            ) {
              if (
                v.bottomRow <= selectedWidgetTopColumn &&
                v.bottomRow > topEdgeBorder
              ) {
                topEdgeBorder = v.bottomRow;
              }
              if (
                v.topRow >= selectedWidgetBottomColumn &&
                v.topRow < bottomEdgeBorder
              ) {
                bottomEdgeBorder = v.topRow;
              }
            }
          },
        );
        const moveOffset =
          (bottomEdgeBorder -
            topEdgeBorder -
            (selectedWidgetBottomColumn - selectedWidgetTopColumn)) /
          2;

        let i = 0;

        while (i < selectedWidgets.length) {
          const widgetKey = selectedWidgets[i];
          yield call(
            updateWidgetPropertySaga,
            updateWidgetPropertyRequest(
              widgetKey,
              "topRow",
              allWidgets[widgetKey].topRow -
                (selectedWidgetTopColumn - (topEdgeBorder + moveOffset)),
            ),
          );
          yield call(
            updateWidgetPropertySaga,
            updateWidgetPropertyRequest(
              widgetKey,
              "bottomRow",
              allWidgets[widgetKey].bottomRow -
                (selectedWidgetTopColumn - (topEdgeBorder + moveOffset)),
            ),
          );
          i++;
        }
      }
      // console.log(system.potentials(), 'potentials');
    }

    //overall left
    if (isMultipleWidgetsSelected && action.payload === ALIGN_TYPE.ONE_L) {
      const selectedWidgetLeftColumn = min(
        selectedWidgets.map((each) => allWidgets[each].leftColumn),
      ) as number;
      const selectedWidgetTopColumn = min(
        selectedWidgets.map((each) => allWidgets[each].topRow),
      ) as number;
      const selectedWidgetBottomColumn = max(
        selectedWidgets.map((each) => allWidgets[each].bottomRow),
      ) as number;
      const system = new Collisions();
      const wall = system.createPolygon(
        0,
        0,
        [
          [0, selectedWidgetTopColumn],
          [0, selectedWidgetBottomColumn],
          [selectedWidgetLeftColumn, selectedWidgetBottomColumn],
          [selectedWidgetLeftColumn, selectedWidgetTopColumn],
        ],
        0,
        1,
        1,
        -0.1,
      );

      each(
        filter(
          allWidgets,
          (v, k) =>
            !includes(selectedWidgets, k) &&
            v.widgetId !== "0" &&
            v.bottomRow > selectedWidgetTopColumn &&
            v.topRow < selectedWidgetBottomColumn,
        ),
        (v) => {
          const { bottomRow, leftColumn, rightColumn, topRow } = v;
          const newWall = system.createPolygon(
            0,
            0,
            [
              [leftColumn, topRow],
              [leftColumn, bottomRow],
              [rightColumn, bottomRow],
              [rightColumn, topRow],
            ],
            0,
            1,
            1,
            -0.1,
          );
          newWall.widget = v;
          system.update();
        },
      );

      system.update();
      const potentials: [Wall] = wall.potentials();

      let i = 0;
      let calculationSelectedWidgetLeftColumn = 0;
      while (i < selectedWidgets.length) {
        if (potentials.length) {
          calculationSelectedWidgetLeftColumn = max(
            potentials.map((v) => v._max_x),
          ) as number;
        }
        const widgetKey = selectedWidgets[i];
        yield call(
          updateWidgetPropertySaga,
          updateWidgetPropertyRequest(
            widgetKey,
            "leftColumn",
            allWidgets[widgetKey].leftColumn -
              (selectedWidgetLeftColumn - calculationSelectedWidgetLeftColumn),
          ),
        );
        yield call(
          updateWidgetPropertySaga,
          updateWidgetPropertyRequest(
            widgetKey,
            "rightColumn",
            allWidgets[widgetKey].rightColumn -
              (selectedWidgetLeftColumn - calculationSelectedWidgetLeftColumn),
          ),
        );
        i++;
      }
    }

    //entire right
    if (isMultipleWidgetsSelected && action.payload === ALIGN_TYPE.ONE_R) {
      const selectedWidgetTopColumn = min(
        selectedWidgets.map((each) => allWidgets[each].topRow),
      ) as number;
      const selectedWidgetBottomColumn = max(
        selectedWidgets.map((each) => allWidgets[each].bottomRow),
      ) as number;
      const selectedWidgetRightColumn = max(
        selectedWidgets.map((each) => allWidgets[each].rightColumn),
      ) as number;
      const system = new Collisions();
      const wall = system.createPolygon(
        0,
        0,
        [
          [selectedWidgetRightColumn, selectedWidgetTopColumn],
          [selectedWidgetRightColumn, selectedWidgetBottomColumn],
          [64, selectedWidgetBottomColumn],
          [64, selectedWidgetTopColumn],
        ],
        0,
        1,
        1,
        -0.1,
      );

      each(
        filter(
          allWidgets,
          (v, k) =>
            !includes(selectedWidgets, k) &&
            v.widgetId !== "0" &&
            v.bottomRow > selectedWidgetTopColumn &&
            v.topRow < selectedWidgetBottomColumn,
        ),
        (v) => {
          const { bottomRow, leftColumn, rightColumn, topRow } = v;
          const newWall = system.createPolygon(
            0,
            0,
            [
              [leftColumn, topRow],
              [leftColumn, bottomRow],
              [rightColumn, bottomRow],
              [rightColumn, topRow],
            ],
            0,
            1,
            1,
            -0.1,
          );
          newWall.widget = v;
          system.update();
        },
      );

      system.update();
      const potentials: [Wall] = wall.potentials();
      let calculationSelectedWidgetRightColumn = 64;
      if (potentials.length) {
        calculationSelectedWidgetRightColumn = min(
          potentials.map((v) => v._min_x),
        ) as number;
      }

      let i = 0;
      while (i < selectedWidgets.length) {
        const widgetKey = selectedWidgets[i];
        // if (allWidgets[widgetKey].leftColumn > selectedWidgetLeftColumn) {
        yield call(
          updateWidgetPropertySaga,
          updateWidgetPropertyRequest(
            widgetKey,
            "leftColumn",
            allWidgets[widgetKey].leftColumn +
              (calculationSelectedWidgetRightColumn -
                selectedWidgetRightColumn),
          ),
        );
        yield call(
          updateWidgetPropertySaga,
          updateWidgetPropertyRequest(
            widgetKey,
            "rightColumn",
            allWidgets[widgetKey].rightColumn +
              (calculationSelectedWidgetRightColumn -
                selectedWidgetRightColumn),
          ),
        );
        i++;
      }
    }

    // overall up
    if (isMultipleWidgetsSelected && action.payload === ALIGN_TYPE.ONE_T) {
      const selectedWidgetLeftColumn = min(
        selectedWidgets.map((each) => allWidgets[each].leftColumn),
      ) as number;
      const selectedWidgetTopColumn = min(
        selectedWidgets.map((each) => allWidgets[each].topRow),
      ) as number;
      const selectedWidgetRightColumn = max(
        selectedWidgets.map((each) => allWidgets[each].rightColumn),
      ) as number;
      const system = new Collisions();
      const wall = system.createPolygon(
        0,
        0,
        [
          [selectedWidgetLeftColumn, 0],
          [selectedWidgetLeftColumn, selectedWidgetTopColumn],
          [selectedWidgetRightColumn, selectedWidgetTopColumn],
          [selectedWidgetRightColumn, 0],
        ],
        0,
        1,
        1,
        -0.1,
      );

      each(
        filter(
          allWidgets,
          (v, k) =>
            !includes(selectedWidgets, k) &&
            v.widgetId !== "0" &&
            v.rightColumn > selectedWidgetLeftColumn &&
            v.leftColumn < selectedWidgetRightColumn,
        ),
        (v) => {
          const { bottomRow, leftColumn, rightColumn, topRow } = v;
          const newWall = system.createPolygon(
            0,
            0,
            [
              [leftColumn, topRow],
              [leftColumn, bottomRow],
              [rightColumn, bottomRow],
              [rightColumn, topRow],
            ],
            0,
            1,
            1,
            -0.1,
          );
          newWall.widget = v;
          system.update();
        },
      );

      system.update();
      const potentials: [Wall] = wall.potentials();
      let i = 0;
      let calculationSelectedWidgetTopColumn = 0;
      while (i < selectedWidgets.length) {
        if (potentials.length) {
          calculationSelectedWidgetTopColumn = max(
            potentials.map((v) => v._max_y),
          ) as number;
        }
        const widgetKey = selectedWidgets[i];
        yield call(
          updateWidgetPropertySaga,
          updateWidgetPropertyRequest(
            widgetKey,
            "topRow",
            allWidgets[widgetKey].topRow -
              (selectedWidgetTopColumn - calculationSelectedWidgetTopColumn),
          ),
        );
        yield call(
          updateWidgetPropertySaga,
          updateWidgetPropertyRequest(
            widgetKey,
            "bottomRow",
            allWidgets[widgetKey].bottomRow -
              (selectedWidgetTopColumn - calculationSelectedWidgetTopColumn),
          ),
        );
        i++;
      }
    }

    // center as a whole
    if (isMultipleWidgetsSelected && action.payload === ALIGN_TYPE.ONE_C) {
      const selectedWidgetLeftColumn = min(
        selectedWidgets.map((each) => allWidgets[each].leftColumn),
      ) as number;
      const selectedWidgetTopColumn = min(
        selectedWidgets.map((each) => allWidgets[each].topRow),
      ) as number;
      const selectedWidgetBottomColumn = max(
        selectedWidgets.map((each) => allWidgets[each].bottomRow),
      ) as number;
      const selectedWidgetRightColumn = max(
        selectedWidgets.map((each) => allWidgets[each].rightColumn),
      ) as number;

      let leftEdgeBorder = 0;
      let rightEdgeBorder = 64;
      each(allWidgets, (v, k) => {
        if (
          !includes(selectedWidgets, k) &&
          v.widgetId !== "0" &&
          v.bottomRow > selectedWidgetTopColumn &&
          v.topRow < selectedWidgetBottomColumn
        ) {
          if (
            v.rightColumn <= selectedWidgetLeftColumn &&
            v.rightColumn > leftEdgeBorder
          ) {
            leftEdgeBorder = v.rightColumn;
          }
          if (
            v.leftColumn >= selectedWidgetRightColumn &&
            v.leftColumn < rightEdgeBorder
          ) {
            rightEdgeBorder = v.leftColumn;
          }
        }
      });
      const moveOffset =
        (rightEdgeBorder -
          leftEdgeBorder -
          (selectedWidgetRightColumn - selectedWidgetLeftColumn)) /
        2;

      let i = 0;

      while (i < selectedWidgets.length) {
        const widgetKey = selectedWidgets[i];
        yield call(
          updateWidgetPropertySaga,
          updateWidgetPropertyRequest(
            widgetKey,
            "leftColumn",
            allWidgets[widgetKey].leftColumn -
              (selectedWidgetLeftColumn - (leftEdgeBorder + moveOffset)),
          ),
        );
        yield call(
          updateWidgetPropertySaga,
          updateWidgetPropertyRequest(
            widgetKey,
            "rightColumn",
            allWidgets[widgetKey].rightColumn -
              (selectedWidgetLeftColumn - (leftEdgeBorder + moveOffset)),
          ),
        );
        i++;
      }
    }
  }
}

export function* resizeSaga(resizeAction: ReduxAction<WidgetResize>) {
  try {
    Toaster.clear();
    const start = performance.now();
    const {
      bottomRow,
      leftColumn,
      parentId,
      rightColumn,
      snapColumnSpace,
      snapRowSpace,
      topRow,
      widgetId,
    } = resizeAction.payload;

    const stateWidget: FlattenedWidgetProps = yield select(getWidget, widgetId);
    let widget = { ...stateWidget };
    const stateWidgets: CanvasWidgetsReduxState = yield select(getWidgets);
    const widgets = { ...stateWidgets };

    widget = { ...widget, leftColumn, rightColumn, topRow, bottomRow };
    const movedWidgets: {
      [widgetId: string]: FlattenedWidgetProps;
    } = yield call(
      reflowWidgets,
      widgets,
      widget,
      snapColumnSpace,
      snapRowSpace,
    );

    const updatedCanvasBottomRow: number = yield call(
      getCanvasSizeAfterWidgetMove,
      parentId,
      [widgetId],
      bottomRow,
    );
    if (updatedCanvasBottomRow) {
      const canvasWidget = movedWidgets[parentId];
      movedWidgets[parentId] = {
        ...canvasWidget,
        bottomRow: updatedCanvasBottomRow,
      };
    }
    log.debug("resize computations took", performance.now() - start, "ms");
    yield put(stopReflowAction());
    yield put(updateAndSaveLayout(movedWidgets));
    yield put(generateAutoHeightLayoutTreeAction(true, true));
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.WIDGET_OPERATION_ERROR,
      payload: {
        action: WidgetReduxActionTypes.WIDGET_RESIZE,
        error,
      },
    });
  }
}

export function* reflowWidgets(
  widgets: {
    [widgetId: string]: FlattenedWidgetProps;
  },
  widget: FlattenedWidgetProps,
  snapColumnSpace: number,
  snapRowSpace: number,
) {
  const reflowState: widgetReflow = yield select(getReflow);

  const currentWidgets: {
    [widgetId: string]: FlattenedWidgetProps;
  } = { ...widgets, [widget.widgetId]: { ...widget } };

  if (!reflowState || !reflowState.isReflowing || !reflowState.reflowingWidgets)
    return currentWidgets;

  const reflowingWidgets = reflowState.reflowingWidgets;

  const reflowWidgetKeys = Object.keys(reflowingWidgets || {});

  if (reflowWidgetKeys.length <= 0) return widgets;

  for (const reflowedWidgetId of reflowWidgetKeys) {
    const reflowWidget = reflowingWidgets[reflowedWidgetId];
    const canvasWidget = { ...currentWidgets[reflowedWidgetId] };
    if (reflowWidget.X !== undefined && reflowWidget.width !== undefined) {
      const leftColumn =
        canvasWidget.leftColumn + reflowWidget.X / snapColumnSpace;
      const rightColumn = leftColumn + reflowWidget.width / snapColumnSpace;
      currentWidgets[reflowedWidgetId] = {
        ...canvasWidget,
        leftColumn,
        rightColumn,
      };
    } else if (
      reflowWidget.Y !== undefined &&
      reflowWidget.height !== undefined
    ) {
      const topRow = canvasWidget.topRow + reflowWidget.Y / snapRowSpace;
      const bottomRow = topRow + reflowWidget.height / snapRowSpace;
      currentWidgets[reflowedWidgetId] = { ...canvasWidget, topRow, bottomRow };
    }
  }

  if (
    collisionCheckPostReflow(currentWidgets, reflowWidgetKeys, widget.parentId)
  ) {
    return currentWidgets;
  }

  return widgets;
}

enum DynamicPathUpdateEffectEnum {
  ADD = "ADD",
  REMOVE = "REMOVE",
  NOOP = "NOOP",
}

type DynamicPathUpdate = {
  propertyPath: string;
  effect: DynamicPathUpdateEffectEnum;
};

function getDynamicTriggerPathListUpdate(
  widget: WidgetProps,
  propertyPath: string,
  propertyValue: string,
): DynamicPathUpdate {
  if (propertyValue && !isPathDynamicTrigger(widget, propertyPath)) {
    return {
      propertyPath,
      effect: DynamicPathUpdateEffectEnum.ADD,
    };
  } else if (!propertyValue && !isPathDynamicTrigger(widget, propertyPath)) {
    return {
      propertyPath,
      effect: DynamicPathUpdateEffectEnum.REMOVE,
    };
  }
  return {
    propertyPath,
    effect: DynamicPathUpdateEffectEnum.NOOP,
  };
}

function getDynamicBindingPathListUpdate(
  widget: WidgetProps,
  propertyPath: string,
  propertyValue: any,
): DynamicPathUpdate {
  let stringProp = propertyValue;
  if (_.isObject(propertyValue)) {
    // Stringify this because composite controls may have bindings in the sub controls
    stringProp = JSON.stringify(propertyValue);
  }

  //TODO(abhinav): This is not appropriate from the platform's archtecture's point of view.
  // Figure out a holistic solutions where we donot have to stringify above.
  if (propertyPath === "primaryColumns" || propertyPath === "derivedColumns") {
    return {
      propertyPath,
      effect: DynamicPathUpdateEffectEnum.NOOP,
    };
  }

  const isDynamic = isDynamicValue(stringProp);
  if (!isDynamic && isPathADynamicBinding(widget, propertyPath)) {
    return {
      propertyPath,
      effect: DynamicPathUpdateEffectEnum.REMOVE,
    };
  } else if (isDynamic && !isPathADynamicBinding(widget, propertyPath)) {
    return {
      propertyPath,
      effect: DynamicPathUpdateEffectEnum.ADD,
    };
  }
  return {
    propertyPath,
    effect: DynamicPathUpdateEffectEnum.NOOP,
  };
}

function applyDynamicPathUpdates(
  currentList: DynamicPath[],
  update: DynamicPathUpdate,
): DynamicPath[] {
  if (update.effect === DynamicPathUpdateEffectEnum.ADD) {
    currentList.push({
      key: update.propertyPath,
    });
  } else if (update.effect === DynamicPathUpdateEffectEnum.REMOVE) {
    currentList = _.reject(currentList, { key: update.propertyPath });
  }
  return currentList;
}

function* updateWidgetPropertySaga(
  updateAction: ReduxAction<UpdateWidgetPropertyRequestPayload>,
) {
  const {
    payload: { propertyPath, propertyValue, widgetId },
  } = updateAction;

  // Holder object to collect all updates
  const updates: Record<string, unknown> = {
    [propertyPath]: propertyValue,
  };
  // Push these updates via the batch update
  yield call(
    batchUpdateWidgetPropertySaga,
    batchUpdateWidgetProperty(widgetId, { modify: updates }),
  );
}

export function removeDynamicBindingProperties(
  propertyPath: string,
  dynamicBindingPathList: DynamicPath[],
) {
  /*
  we are doing this because when you toggle js off we only
  receive the  `primaryColumns.` properties not the `derivedColumns.`
  properties therefore we need just a hard-codded check.
  (TODO) - Arsalan remove this primaryColumns check when the Table widget v2 is live.
  */

  if (_.startsWith(propertyPath, "primaryColumns")) {
    // primaryColumns.customColumn1.isVisible -> customColumn1.isVisible
    const tableProperty = propertyPath
      .split(".")
      .splice(1)
      .join(".");
    const tablePropertyPathsToRemove = [
      propertyPath, // primaryColumns.customColumn1.isVisible
      `derivedColumns.${tableProperty}`, // derivedColumns.customColumn1.isVisible
    ];
    return _.reject(dynamicBindingPathList, ({ key }) =>
      tablePropertyPathsToRemove.includes(key),
    );
  } else {
    return _.reject(dynamicBindingPathList, {
      key: propertyPath,
    });
  }
}

export function* setWidgetDynamicPropertySaga(
  action: ReduxAction<SetWidgetDynamicPropertyPayload>,
) {
  const {
    isDynamic,
    propertyPath,
    shouldRejectDynamicBindingPathList = true,
    widgetId,
  } = action.payload;
  const stateWidget: WidgetProps = yield select(getWidget, widgetId);
  let widget = cloneDeep({ ...stateWidget });
  const propertyValue = _.get(widget, propertyPath);

  let dynamicPropertyPathList = getWidgetDynamicPropertyPathList(widget);
  let dynamicBindingPathList = getEntityDynamicBindingPathList(widget);
  if (isDynamic) {
    const keyExists =
      dynamicPropertyPathList.findIndex((path) => path.key === propertyPath) >
      -1;
    if (!keyExists) {
      dynamicPropertyPathList.push({
        key: propertyPath,
      });
    }
    widget = set(widget, propertyPath, convertToString(propertyValue));
  } else {
    dynamicPropertyPathList = _.reject(dynamicPropertyPathList, {
      key: propertyPath,
    });

    if (shouldRejectDynamicBindingPathList) {
      dynamicBindingPathList = removeDynamicBindingProperties(
        propertyPath,
        dynamicBindingPathList,
      );
    }
    const { parsed } = yield call(
      validateProperty,
      propertyPath,
      propertyValue,
      widget,
    );
    widget = set(widget, propertyPath, parsed);
  }

  widget.dynamicPropertyPathList = dynamicPropertyPathList;
  widget.dynamicBindingPathList = dynamicBindingPathList;
  const stateWidgets: CanvasWidgetsReduxState = yield select(getWidgets);
  const widgets = { ...stateWidgets, [widgetId]: widget };

  // Save the layout
  yield put(updateAndSaveLayout(widgets));
}

export function getPropertiesToUpdate(
  widget: WidgetProps,
  updates: Record<string, unknown>,
  triggerPaths?: string[],
): {
  propertyUpdates: Record<string, unknown>;
  dynamicTriggerPathList: DynamicPath[];
  dynamicBindingPathList: DynamicPath[];
} {
  // Create a
  const widgetWithUpdates = _.cloneDeep(widget);
  Object.entries(updates).forEach(([propertyPath, propertyValue]) => {
    set(widgetWithUpdates, propertyPath, propertyValue);
  });

  // get the flat list of all updates (in case values are objects)
  const updatePaths = getAllPaths(updates);

  const propertyUpdates: Record<string, unknown> = {
    ...updates,
  };
  const currentDynamicTriggerPathList: DynamicPath[] = getWidgetDynamicTriggerPathList(
    widget,
  );
  const currentDynamicBindingPathList: DynamicPath[] = getEntityDynamicBindingPathList(
    widget,
  );
  const dynamicTriggerPathListUpdates: DynamicPathUpdate[] = [];
  const dynamicBindingPathListUpdates: DynamicPathUpdate[] = [];

  const widgetConfig = WidgetFactory.getWidgetPropertyPaneConfig(widget.type);
  const {
    triggerPaths: triggerPathsFromPropertyConfig = {},
  } = getAllPathsFromPropertyConfig(widgetWithUpdates, widgetConfig, {});

  Object.keys(updatePaths).forEach((propertyPath) => {
    const propertyValue = getValueFromTree(updates, propertyPath);
    // only check if
    if (!_.isString(propertyValue)) {
      return;
    }

    let isTriggerProperty = propertyPath in triggerPathsFromPropertyConfig;

    isTriggerProperty = doesTriggerPathsContainPropertyPath(
      isTriggerProperty,
      propertyPath,
      triggerPaths,
    );

    // If it is a trigger property, it will go in a different list than the general
    // dynamicBindingPathList.
    if (isTriggerProperty) {
      dynamicTriggerPathListUpdates.push(
        getDynamicTriggerPathListUpdate(widget, propertyPath, propertyValue),
      );
    } else {
      dynamicBindingPathListUpdates.push(
        getDynamicBindingPathListUpdate(widget, propertyPath, propertyValue),
      );
    }
  });

  const dynamicTriggerPathList = dynamicTriggerPathListUpdates.reduce(
    applyDynamicPathUpdates,
    currentDynamicTriggerPathList,
  );
  const dynamicBindingPathList = dynamicBindingPathListUpdates.reduce(
    applyDynamicPathUpdates,
    currentDynamicBindingPathList,
  );

  return {
    propertyUpdates,
    dynamicTriggerPathList,
    dynamicBindingPathList,
  };
}

export function* getIsContainerLikeWidget(widget: FlattenedWidgetProps) {
  const children = widget.children;
  if (Array.isArray(children) && children.length > 0) {
    const firstChild: FlattenedWidgetProps = yield select(
      getWidget,
      children[0],
    );
    if (firstChild.type === "CANVAS_WIDGET") return true;
  }
  return false;
}

export function* getPropertiesUpdatedWidget(
  updatesObj: UpdateWidgetPropertyPayload,
) {
  const { dynamicUpdates, updates, widgetId } = updatesObj;

  const { modify = {}, remove = [], postUpdateAction, triggerPaths } = updates;

  const stateWidget: WidgetProps = yield select(getWidget, widgetId);

  // if there is no widget in the state, don't do anything
  if (!stateWidget) return;

  let widget = cloneDeep(stateWidget);
  try {
    if (Object.keys(modify).length > 0) {
      const {
        dynamicBindingPathList,
        dynamicTriggerPathList,
        propertyUpdates,
      } = getPropertiesToUpdate(widget, modify, triggerPaths);

      // We loop over all updates
      Object.entries(propertyUpdates).forEach(
        ([propertyPath, propertyValue]) => {
          // since property paths could be nested, we use lodash set method
          widget = set(widget, propertyPath, propertyValue);
        },
      );
      widget.dynamicBindingPathList = dynamicBindingPathList;
      widget.dynamicTriggerPathList = dynamicTriggerPathList;

      if (dynamicUpdates?.dynamicPropertyPathList?.length) {
        widget.dynamicPropertyPathList = mergeDynamicPropertyPaths(
          widget.dynamicPropertyPathList,
          dynamicUpdates.dynamicPropertyPathList,
        );
      }
    }
  } catch (e) {
    log.debug("Error updating property paths: ", { e });
  }

  if (Array.isArray(remove) && remove.length > 0) {
    widget = yield removeWidgetProperties(widget, remove);
  }

  // Note: This may not be the best place to do this.
  // If there exists another spot in this workflow, where we are iterating over the dynamicTriggerPathList and dynamicBindingPathList, after
  // performing all updates to the widget, we can piggy back on that iteration to purge orphaned paths
  // I couldn't find it, so here it is.
  return {
    updatedWidget: purgeOrphanedDynamicPaths(widget),
    actionToDispatch: postUpdateAction,
  };
}

function* batchUpdateWidgetPropertySaga(
  action: ReduxAction<UpdateWidgetPropertyPayload>,
) {
  const start = performance.now();
  const { shouldReplay, widgetId } = action.payload;
  if (!widgetId) {
    // Handling the case where sometimes widget id is not passed through here
    return;
  }
  const updatedWidgetAndActionsToDispatch: {
    updatedWidget: WidgetProps;
    actionToDispatch?: ReduxActionType;
  } = yield call(getPropertiesUpdatedWidget, action.payload);
  const stateWidgets: CanvasWidgetsReduxState = yield select(getWidgets);
  const widgets = {
    ...stateWidgets,
    [widgetId]: updatedWidgetAndActionsToDispatch.updatedWidget,
  };
  log.debug(
    "Batch widget property update calculations took: ",
    action,
    performance.now() - start,
    "ms",
  );
  // Save the layout
  yield put(updateAndSaveLayout(widgets, { shouldReplay }));
  if (updatedWidgetAndActionsToDispatch.actionToDispatch) {
    yield put({
      type: updatedWidgetAndActionsToDispatch.actionToDispatch,
      payload: { widgetId },
    });
  }
}

function* batchUpdateMultipleWidgetsPropertiesSaga(
  action: ReduxAction<{ updatesArray: UpdateWidgetPropertyPayload[] }>,
) {
  const start = performance.now();
  const { updatesArray } = action.payload;
  const stateWidgets: CanvasWidgetsReduxState = yield select(getWidgets);
  const updatedWidgetsAndActionsToDispatch: Array<{
    updatedWidget: WidgetProps;
    actionToDispatch?: ReduxActionType;
  }> = yield all(
    updatesArray.map((eachUpdate) => {
      return call(getPropertiesUpdatedWidget, eachUpdate);
    }),
  );

  const updatedStateWidgets = updatedWidgetsAndActionsToDispatch.reduce(
    (allWidgets, eachUpdatedWidgetAndActionsToDispatch) => {
      return {
        ...allWidgets,
        [eachUpdatedWidgetAndActionsToDispatch.updatedWidget.widgetId]:
          eachUpdatedWidgetAndActionsToDispatch.updatedWidget,
      };
    },
    stateWidgets,
  );

  const updatedWidgetIds = uniq(
    updatedWidgetsAndActionsToDispatch.map(
      (each) => each.updatedWidget.widgetId,
    ),
  );

  log.debug(
    "Batch multi-widget properties update calculations took: ",
    performance.now() - start,
    "ms",
  );

  // Save the layout
  yield put(
    updateAndSaveLayout(updatedStateWidgets, {
      updatedWidgetIds,
    }),
  );
  for (const updatedWidgetAndActions of updatedWidgetsAndActionsToDispatch) {
    if (updatedWidgetAndActions.actionToDispatch) {
      yield put({
        type: updatedWidgetAndActions.actionToDispatch,
        payload: { widgetId: updatedWidgetAndActions.updatedWidget.widgetId },
      });
    }
  }
}

function* removeWidgetProperties(widget: WidgetProps, paths: string[]) {
  try {
    let dynamicTriggerPathList: DynamicPath[] = getWidgetDynamicTriggerPathList(
      widget,
    );
    let dynamicBindingPathList: DynamicPath[] = getEntityDynamicBindingPathList(
      widget,
    );
    let dynamicPropertyPathList: DynamicPath[] = getWidgetDynamicPropertyPathList(
      widget,
    );

    paths.forEach((propertyPath) => {
      dynamicTriggerPathList = dynamicTriggerPathList.filter((dynamicPath) => {
        return !isChildPropertyPath(propertyPath, dynamicPath.key);
      });

      dynamicBindingPathList = dynamicBindingPathList.filter((dynamicPath) => {
        return !isChildPropertyPath(propertyPath, dynamicPath.key);
      });

      dynamicPropertyPathList = dynamicPropertyPathList.filter(
        (dynamicPath) => {
          return !isChildPropertyPath(propertyPath, dynamicPath.key);
        },
      );
    });

    widget.dynamicBindingPathList = dynamicBindingPathList;
    widget.dynamicTriggerPathList = dynamicTriggerPathList;
    widget.dynamicPropertyPathList = dynamicPropertyPathList;

    paths.forEach((propertyPath) => {
      widget = unsetPropertyPath(widget, propertyPath) as WidgetProps;
    });
  } catch (e) {
    log.debug("Error removing propertyPaths: ", { e });
  }

  return widget;
}

function* deleteWidgetPropertySaga(
  action: ReduxAction<DeleteWidgetPropertyPayload>,
) {
  const { propertyPaths, widgetId } = action.payload;
  if (!widgetId) {
    // Handling the case where sometimes widget id is not passed through here
    return;
  }

  yield put(batchUpdateWidgetProperty(widgetId, { remove: propertyPaths }));
}

//TODO(abhinav): Move this to helpers and add tests
const unsetPropertyPath = (obj: Record<string, unknown>, path: string) => {
  const regex = /(.*)\[\d+\]$/;
  if (regex.test(path)) {
    const matches = path.match(regex);
    if (
      matches &&
      Array.isArray(matches) &&
      matches[1] &&
      matches[1].length > 0
    ) {
      _.unset(obj, path);
      const arr = _.get(obj, matches[1]);
      if (arr && Array.isArray(arr)) {
        _.set(obj, matches[1], arr.filter(Boolean));
      }
    }
  } else {
    _.unset(obj, path);
  }
  return obj;
};

function* resetChildrenMetaSaga(action: ReduxAction<{ widgetId: string }>) {
  const { widgetId: parentWidgetId } = action.payload;
  const canvasWidgets: CanvasWidgetsReduxState = yield select(getWidgets);
  const evaluatedDataTree: DataTree = yield select(getDataTree);
  const widgetsMeta: MetaState = yield select(getWidgetsMeta);
  const childrenList = getWidgetDescendantToReset(
    canvasWidgets,
    parentWidgetId,
    evaluatedDataTree,
    widgetsMeta,
  );

  for (const childIndex in childrenList) {
    const { evaluatedWidget: childWidget, id: childId } = childrenList[
      childIndex
    ];
    yield put(resetWidgetMetaProperty(childId, childWidget));
  }
}

function* updateCanvasSize(
  action: ReduxAction<{ canvasWidgetId: string; snapRows: number }>,
) {
  const { canvasWidgetId, snapRows } = action.payload;
  const canvasWidget: FlattenedWidgetProps = yield select(
    getWidget,
    canvasWidgetId,
  );

  const originalSnapRows = canvasWidget.bottomRow - canvasWidget.topRow;

  const newBottomRow = Math.round(
    snapRows * GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
  );
  /* Update the canvas's rows, ONLY if it has changed since the last render */
  if (originalSnapRows !== newBottomRow) {
    // TODO(abhinav): This considers that the topRow will always be zero
    // Check this out when non canvas widgets are updating snapRows
    // erstwhile: Math.round((rows * props.snapRowSpace) / props.parentRowSpace),
    yield put(
      updateMultipleWidgetPropertiesAction({
        [canvasWidgetId]: [
          {
            propertyPath: "bottomRow",
            propertyValue: newBottomRow,
          },
        ],
      }),
    );
  }
}

function* createSelectedWidgetsCopy(selectedWidgets: FlattenedWidgetProps[]) {
  if (!selectedWidgets || !selectedWidgets.length) return;
  const widgetListsToStore: {
    widgetId: string;
    parentId: string;
    list: FlattenedWidgetProps[];
  }[] = yield all(selectedWidgets.map((each) => call(createWidgetCopy, each)));

  const saveResult: boolean = yield saveCopiedWidgets(
    JSON.stringify(widgetListsToStore),
  );
  return saveResult;
}

/**
 * copy here actually means saving a JSON in local storage
 * so when a user hits copy on a selected widget, we save widget in localStorage
 *
 * @param action
 * @returns
 */
function* copyWidgetSaga(action: ReduxAction<{ isShortcut: boolean }>) {
  const allWidgets: { [widgetId: string]: FlattenedWidgetProps } = yield select(
    getWidgets,
  );
  const selectedWidgets: string[] = yield select(getSelectedWidgets);
  if (!selectedWidgets) {
    Toaster.show({
      text: createMessage(ERROR_WIDGET_COPY_NO_WIDGET_SELECTED),
      variant: Variant.info,
    });
    return;
  }

  const allAllowedToCopy = selectedWidgets.some((each) => {
    return allWidgets[each] && !allWidgets[each].disallowCopy;
  });

  if (!allAllowedToCopy) {
    Toaster.show({
      text: createMessage(ERROR_WIDGET_COPY_NOT_ALLOWED),
      variant: Variant.info,
    });

    return;
  }
  const selectedWidgetProps = selectedWidgets.map((each) => allWidgets[each]);

  const saveResult: boolean = yield createSelectedWidgetsCopy(
    selectedWidgetProps,
  );

  selectedWidgetProps.forEach((each) => {
    const eventName = action.payload.isShortcut
      ? "WIDGET_COPY_VIA_SHORTCUT"
      : "WIDGET_COPY";
    AnalyticsUtil.logEvent(eventName, {
      widgetName: each.widgetName,
      widgetType: each.type,
    });
  });

  if (saveResult) {
    Toaster.show({
      text: createMessage(
        WIDGET_COPY,
        selectedWidgetProps.length > 1
          ? `${selectedWidgetProps.length} Widgets`
          : selectedWidgetProps[0].widgetName,
      ),
      variant: Variant.success,
    });
  }
}

/**
 *  We take the bottom most widget in the canvas, then calculate the top,left,right,bottom
 *  co-ordinates for the new widget, such that it can be placed at the bottom of the canvas.
 *
 * @param widget
 * @param parentId
 * @param canvasWidgets
 * @param parentBottomRow
 * @param newPastingPositionMap
 * @param shouldPersistColumnPosition
 * @param isThereACollision
 * @param shouldGroup
 * @returns
 */
export function calculateNewWidgetPosition(
  widget: WidgetProps,
  parentId: string,
  canvasWidgets: { [widgetId: string]: FlattenedWidgetProps },
  parentBottomRow?: number,
  newPastingPositionMap?: SpaceMap,
  shouldPersistColumnPosition = false,
  isThereACollision = false,
  shouldGroup = false,
): {
  topRow: number;
  bottomRow: number;
  leftColumn: number;
  rightColumn: number;
} {
  if (
    !shouldGroup &&
    newPastingPositionMap &&
    newPastingPositionMap[widget.widgetId]
  ) {
    const newPastingPosition = newPastingPositionMap[widget.widgetId];
    return {
      topRow: newPastingPosition.top,
      bottomRow: newPastingPosition.bottom,
      leftColumn: newPastingPosition.left,
      rightColumn: newPastingPosition.right,
    };
  }

  const nextAvailableRow = parentBottomRow
    ? parentBottomRow
    : nextAvailableRowInContainer(parentId, canvasWidgets);
  return {
    leftColumn: shouldPersistColumnPosition ? widget.leftColumn : 0,
    rightColumn: shouldPersistColumnPosition
      ? widget.rightColumn
      : widget.rightColumn - widget.leftColumn,
    topRow:
      !isThereACollision && shouldGroup
        ? widget.topRow
        : parentBottomRow
        ? nextAvailableRow + widget.topRow
        : nextAvailableRow,
    bottomRow:
      !isThereACollision && shouldGroup
        ? widget.bottomRow
        : parentBottomRow
        ? nextAvailableRow + widget.bottomRow
        : nextAvailableRow + (widget.bottomRow - widget.topRow),
  };
}

/**
 * Method to provide the new positions where the widgets can be pasted.
 * It will return an empty object if it doesn't have any selected widgets, or if the mouse is outside the canvas.
 *
 * @param copiedWidgetGroups Contains information on the copied widgets
 * @param mouseLocation location of the mouse in absolute pixels
 * @param copiedTotalWidth total width of the copied widgets
 * @param copiedTopMostRow top row of the top most copied widget
 * @param copiedLeftMostColumn left column of the left most copied widget
 * @returns
 */
const getNewPositions = function*(
  copiedWidgetGroups: CopiedWidgetGroup[],
  mouseLocation: { x: number; y: number },
  copiedTotalWidth: number,
  copiedTopMostRow: number,
  copiedLeftMostColumn: number,
) {
  const selectedWidgetIDs: string[] = yield select(getSelectedWidgets);
  const canvasWidgets: CanvasWidgetsReduxState = yield select(getWidgets);
  const {
    isListWidgetPastingOnItself,
    selectedWidgets,
  } = getVerifiedSelectedWidgets(
    selectedWidgetIDs,
    copiedWidgetGroups,
    canvasWidgets,
  );

  //if the copied widget is a modal widget, then it has to paste on the main container
  if (
    copiedWidgetGroups.length === 1 &&
    copiedWidgetGroups[0].list[0] &&
    copiedWidgetGroups[0].list[0].type === "MODAL_WIDGET"
  )
    return {};

  //if multiple widgets are selected or if a single non-layout widget is selected,
  // then call the method to calculate and return positions based on selected widgets.
  if (
    !(
      selectedWidgets.length === 1 &&
      isDropTarget(selectedWidgets[0].type, true) &&
      !isListWidgetPastingOnItself
    ) &&
    selectedWidgets.length > 0
  ) {
    const newPastingPositionDetails: NewPastePositionVariables = yield call(
      getNewPositionsBasedOnSelectedWidgets,
      copiedWidgetGroups,
      selectedWidgets,
      canvasWidgets,
      copiedTotalWidth,
      copiedTopMostRow,
      copiedLeftMostColumn,
    );
    return newPastingPositionDetails;
  }

  //if a layout widget is selected or mouse is on the main canvas
  // then call the method to calculate and return positions mouse positions.
  const newPastingPositionDetails: NewPastePositionVariables = yield call(
    getNewPositionsBasedOnMousePositions,
    copiedWidgetGroups,
    mouseLocation,
    selectedWidgets,
    canvasWidgets,
    copiedTotalWidth,
    copiedTopMostRow,
    copiedLeftMostColumn,
  );
  return newPastingPositionDetails;
};

/**
 * Calculates the new positions of the pasting widgets, based on the selected widgets
 * The new positions will be just below the selected widgets
 *
 * @param copiedWidgetGroups Contains information on the copied widgets
 * @param selectedWidgets array of selected widgets
 * @param canvasWidgets canvas widgets from the DSL
 * @param copiedTotalWidth total width of the copied widgets
 * @param copiedTopMostRow top row of the top most copied widget
 * @param copiedLeftMostColumn left column of the left most copied widget
 * @returns
 */
function* getNewPositionsBasedOnSelectedWidgets(
  copiedWidgetGroups: CopiedWidgetGroup[],
  selectedWidgets: WidgetProps[],
  canvasWidgets: CanvasWidgetsReduxState,
  copiedTotalWidth: number,
  copiedTopMostRow: number,
  copiedLeftMostColumn: number,
) {
  //get Parent canvasId
  const parentId = selectedWidgets[0].parentId || "";

  // get the Id of the container widget based on the canvasId
  const containerId = getContainerIdForCanvas(parentId);

  const containerWidget = canvasWidgets[containerId];
  const canvasDOM = document.querySelector(`#${getSlidingArenaName(parentId)}`);

  if (!canvasDOM || !containerWidget) return {};

  const rect = canvasDOM.getBoundingClientRect();

  // get Grid values such as snapRowSpace and snapColumnSpace
  const { snapGrid } = getSnappedGrid(containerWidget, rect.width);

  const selectedWidgetsArray = selectedWidgets.length ? selectedWidgets : [];
  //from selected widgets get some information required for position calculation
  const {
    leftMostColumn: selectedLeftMostColumn,
    maxThickness,
    topMostRow: selectedTopMostRow,
    totalWidth,
  } = getBoundariesFromSelectedWidgets(selectedWidgetsArray);

  // calculation of left most column of where widgets are to be pasted
  let pasteLeftMostColumn =
    selectedLeftMostColumn - (copiedTotalWidth - totalWidth) / 2;

  pasteLeftMostColumn = Math.round(pasteLeftMostColumn);

  // conditions to adjust to the edges of the boundary, so that it doesn't go out of canvas
  if (pasteLeftMostColumn < 0) pasteLeftMostColumn = 0;
  if (
    pasteLeftMostColumn + copiedTotalWidth >
    GridDefaults.DEFAULT_GRID_COLUMNS
  )
    pasteLeftMostColumn = GridDefaults.DEFAULT_GRID_COLUMNS - copiedTotalWidth;

  // based on the above calculation get the new Positions that are aligned to the top left of selected widgets
  // i.e., the top of the selected widgets will be equal to the top of copied widgets and both are horizontally centered
  const newPositionsForCopiedWidgets = getNewPositionsForCopiedWidgets(
    copiedWidgetGroups,
    copiedTopMostRow,
    selectedTopMostRow,
    copiedLeftMostColumn,
    pasteLeftMostColumn,
  );

  // with the new positions, calculate the map of new position, which are moved down to the point where
  // it doesn't overlap with any of the selected widgets.
  const newPastingPositionMap = getVerticallyAdjustedPositions(
    newPositionsForCopiedWidgets,
    getOccupiedSpacesFromProps(selectedWidgetsArray),
    maxThickness,
  );

  if (!newPastingPositionMap) return {};

  const gridProps = {
    parentColumnSpace: snapGrid.snapColumnSpace,
    parentRowSpace: snapGrid.snapRowSpace,
    maxGridColumns: GridDefaults.DEFAULT_GRID_COLUMNS,
  };

  const reflowSpacesSelector = getContainerWidgetSpacesSelector(parentId);
  const widgetSpaces: WidgetSpace[] = yield select(reflowSpacesSelector) || [];

  // Ids of each pasting are changed just for reflow
  const newPastePositions = changeIdsOfPastePositions(newPastingPositionMap);

  const { movementMap: reflowedMovementMap } = reflow(
    newPastePositions,
    newPastePositions,
    widgetSpaces,
    ReflowDirection.BOTTOM,
    gridProps,
    true,
    false,
    { prevSpacesMap: {} } as PrevReflowState,
  );

  // calculate the new bottom most row of the canvas
  const bottomMostRow = getBottomRowAfterReflow(
    reflowedMovementMap,
    getBottomMostRow(newPastePositions),
    widgetSpaces,
    gridProps,
  );

  return {
    bottomMostRow:
      (bottomMostRow + GridDefaults.CANVAS_EXTENSION_OFFSET) *
      gridProps.parentRowSpace,
    gridProps,
    newPastingPositionMap,
    reflowedMovementMap,
    canvasId: parentId,
  };
}

/**
 * Calculates the new positions of the pasting widgets, based on the mouse position
 * If the mouse position is on the canvas it the top left of the new positions aligns itself to the mouse position
 * returns a empty object if the mouse is out of canvas
 *
 * @param copiedWidgetGroups Contains information on the copied widgets
 * @param mouseLocation location of the mouse in absolute pixels
 * @param selectedWidgets array of selected widgets
 * @param canvasWidgets canvas widgets from the DSL
 * @param copiedTotalWidth total width of the copied widgets
 * @param copiedTopMostRow top row of the top most copied widget
 * @param copiedLeftMostColumn left column of the left most copied widget
 * @returns
 */
function* getNewPositionsBasedOnMousePositions(
  copiedWidgetGroups: CopiedWidgetGroup[],
  mouseLocation: { x: number; y: number },
  selectedWidgets: WidgetProps[],
  canvasWidgets: CanvasWidgetsReduxState,
  copiedTotalWidth: number,
  copiedTopMostRow: number,
  copiedLeftMostColumn: number,
) {
  let { canvasDOM, canvasId, containerWidget } = getDefaultCanvas(
    canvasWidgets,
  );

  //if the selected widget is a layout widget then change the pasting canvas.
  if (selectedWidgets.length === 1 && isDropTarget(selectedWidgets[0].type)) {
    containerWidget = selectedWidgets[0];
    ({ canvasDOM, canvasId } = getCanvasIdForContainer(containerWidget));
  }

  if (!canvasDOM || !containerWidget || !canvasId) return {};

  const canvasRect = canvasDOM.getBoundingClientRect();

  // get Grid values such as snapRowSpace and snapColumnSpace
  const { padding, snapGrid } = getSnappedGrid(
    containerWidget,
    canvasRect.width,
  );

  // get mouse positions in terms of grid rows and columns of the pasting canvas
  const mousePositions = getMousePositions(
    canvasRect,
    canvasId,
    snapGrid,
    padding,
    mouseLocation,
  );

  if (!snapGrid || !mousePositions) return {};

  const reflowSpacesSelector = getContainerWidgetSpacesSelector(canvasId);
  const widgetSpaces: WidgetSpace[] = yield select(reflowSpacesSelector) || [];

  let mouseTopRow = mousePositions.top;
  let mouseLeftColumn = mousePositions.left;

  // if the mouse position is on another widget on the canvas, then new positions are below it.
  for (const widgetSpace of widgetSpaces) {
    if (
      widgetSpace.top < mousePositions.top &&
      widgetSpace.left < mousePositions.left &&
      widgetSpace.bottom > mousePositions.top &&
      widgetSpace.right > mousePositions.left
    ) {
      mouseTopRow = widgetSpace.bottom + WIDGET_PASTE_PADDING;
      mouseLeftColumn =
        widgetSpace.left -
        (copiedTotalWidth - (widgetSpace.right - widgetSpace.left)) / 2;
      break;
    }
  }

  mouseLeftColumn = Math.round(mouseLeftColumn);

  // adjust the top left based on the edges of the canvas
  if (mouseLeftColumn < 0) mouseLeftColumn = 0;
  if (mouseLeftColumn + copiedTotalWidth > GridDefaults.DEFAULT_GRID_COLUMNS)
    mouseLeftColumn = GridDefaults.DEFAULT_GRID_COLUMNS - copiedTotalWidth;

  // get the new Pasting positions of the widgets based on the adjusted mouse top-left
  const newPastingPositionMap = getPastePositionMapFromMousePointer(
    copiedWidgetGroups,
    copiedTopMostRow,
    mouseTopRow,
    copiedLeftMostColumn,
    mouseLeftColumn,
  );

  const gridProps = {
    parentColumnSpace: snapGrid.snapColumnSpace,
    parentRowSpace: snapGrid.snapRowSpace,
    maxGridColumns: GridDefaults.DEFAULT_GRID_COLUMNS,
  };

  // Ids of each pasting are changed just for reflow
  const newPastePositions = changeIdsOfPastePositions(newPastingPositionMap);

  const { movementMap: reflowedMovementMap } = reflow(
    newPastePositions,
    newPastePositions,
    widgetSpaces,
    ReflowDirection.BOTTOM,
    gridProps,
    true,
    false,
    { prevSpacesMap: {} } as PrevReflowState,
  );

  // calculate the new bottom most row of the canvas.
  const bottomMostRow = getBottomRowAfterReflow(
    reflowedMovementMap,
    getBottomMostRow(newPastePositions),
    widgetSpaces,
    gridProps,
  );

  return {
    bottomMostRow:
      (bottomMostRow + GridDefaults.CANVAS_EXTENSION_OFFSET) *
      gridProps.parentRowSpace,
    gridProps,
    newPastingPositionMap,
    reflowedMovementMap,
    canvasId,
  };
}

/**
 * this saga create a new widget from the copied one to store
 */
function* pasteWidgetSaga(
  action: ReduxAction<{
    groupWidgets: boolean;
    mouseLocation: { x: number; y: number };
  }>,
) {
  let copiedWidgetGroups: CopiedWidgetGroup[] = yield getCopiedWidgets();
  const shouldGroup: boolean = action.payload.groupWidgets;

  const newlyCreatedWidgetIds: string[] = [];
  const evalTree: DataTree = yield select(getDataTree);
  const canvasWidgets: CanvasWidgetsReduxState = yield select(getWidgets);
  let widgets: CanvasWidgetsReduxState = canvasWidgets;
  const selectedWidget: FlattenedWidgetProps<undefined> = yield getSelectedWidgetWhenPasting();

  let reflowedMovementMap,
    gridProps: GridProps | undefined,
    newPastingPositionMap: SpaceMap | undefined,
    canvasId;

  let pastingIntoWidgetId: string = yield getParentWidgetIdForPasting(
    canvasWidgets,
    selectedWidget,
  );

  let isThereACollision = false;

  // if this is true, selected widgets will be grouped in container
  if (shouldGroup) {
    copiedWidgetGroups = yield createSelectedWidgetsAsCopiedWidgets();
    pastingIntoWidgetId = yield getParentWidgetIdForGrouping(
      widgets,
      copiedWidgetGroups,
    );
    widgets = yield filterOutSelectedWidgets(
      copiedWidgetGroups[0].parentId,
      copiedWidgetGroups,
    );
    isThereACollision = yield isSelectedWidgetsColliding(
      widgets,
      copiedWidgetGroups,
      pastingIntoWidgetId,
    );

    //while grouping, the container around the selected widgets will increase by 2 rows,
    //hence if there are any widgets in that path then we reflow those widgets
    // If there are already widgets inside the selection box even before grouping
    //then we will have to move it down to the bottom most row
    ({
      copiedWidgetGroups,
      gridProps,
      reflowedMovementMap,
    } = yield groupWidgetsIntoContainer(
      copiedWidgetGroups,
      pastingIntoWidgetId,
      isThereACollision,
    ));
  }

  if (
    // to avoid invoking old way of copied widgets implementaion
    !Array.isArray(copiedWidgetGroups) ||
    !copiedWidgetGroups.length
  )
    return;

  const {
    leftMostWidget,
    topMostWidget,
    totalWidth: copiedTotalWidth,
  } = getBoundaryWidgetsFromCopiedGroups(copiedWidgetGroups);

  const nextAvailableRow: number = nextAvailableRowInContainer(
    pastingIntoWidgetId,
    widgets,
  );

  // skip new position calculation if grouping
  if (!shouldGroup) {
    // new pasting positions, the variables are undefined if the positions cannot be calculated,
    // then it pastes the regular way at the bottom of the canvas
    ({
      canvasId,
      gridProps,
      newPastingPositionMap,
      reflowedMovementMap,
    } = yield call(
      getNewPositions,
      copiedWidgetGroups,
      action.payload.mouseLocation,
      copiedTotalWidth,
      topMostWidget.topRow,
      leftMostWidget.leftColumn,
    ));

    if (canvasId) pastingIntoWidgetId = canvasId;
  }

  yield all(
    copiedWidgetGroups.map((copiedWidgets) =>
      call(function*() {
        // Don't try to paste if there is no copied widget
        if (!copiedWidgets) return;

        const copiedWidgetId = copiedWidgets.widgetId;
        const unUpdatedCopyOfWidget = copiedWidgets.list[0];
        const newTopRow = shouldGroup
          ? isThereACollision
            ? topMostWidget.topRow
            : 0
          : topMostWidget.topRow;

        const copiedWidget = {
          ...unUpdatedCopyOfWidget,
          topRow: unUpdatedCopyOfWidget.topRow - newTopRow,
          bottomRow: unUpdatedCopyOfWidget.bottomRow - newTopRow,
        };

        // Log the paste or group event.
        if (shouldGroup) {
          AnalyticsUtil.logEvent("WIDGET_GROUP", {
            widgetName: copiedWidget.widgetName,
            widgetType: copiedWidget.type,
          });
        } else {
          AnalyticsUtil.logEvent("WIDGET_PASTE", {
            widgetName: copiedWidget.widgetName,
            widgetType: copiedWidget.type,
          });
        }

        // Compute the new widget's positional properties
        const newWidgetPosition = calculateNewWidgetPosition(
          copiedWidget,
          pastingIntoWidgetId,
          widgets,
          nextAvailableRow,
          newPastingPositionMap,
          true,
          isThereACollision,
          shouldGroup,
        );

        // Get a flat list of all the widgets to be updated
        const widgetList = copiedWidgets.list;
        const widgetIdMap: Record<string, string> = {};
        const widgetNameMap: Record<string, string> = {};
        const newWidgetList: FlattenedWidgetProps[] = [];
        // Generate new widgetIds for the flat list of all the widgets to be updated

        widgetList.forEach((widget) => {
          // Create a copy of the widget properties
          const newWidget = cloneDeep(widget);
          newWidget.widgetId = generateReactKey();
          // Add the new widget id so that it maps the previous widget id
          widgetIdMap[widget.widgetId] = newWidget.widgetId;

          // Add the new widget to the list
          newWidgetList.push(newWidget);
        });

        // For each of the new widgets generated
        for (let i = 0; i < newWidgetList.length; i++) {
          const widget = newWidgetList[i];
          const oldWidgetName = widget.widgetName;
          let newWidgetName = oldWidgetName;

          if (!shouldGroup) {
            newWidgetName = getNextWidgetName(widgets, widget.type, evalTree, {
              prefix: oldWidgetName,
              startWithoutIndex: true,
            });
          }

          // Update the children widgetIds if it has children
          if (widget.children && widget.children.length > 0) {
            widget.children.forEach((childWidgetId: string, index: number) => {
              if (widget.children) {
                widget.children[index] = widgetIdMap[childWidgetId];
              }
            });
          }

          // Update the tabs for the tabs widget.
          if (widget.tabsObj && widget.type === "TABS_WIDGET") {
            try {
              const tabs = Object.values(widget.tabsObj);
              if (Array.isArray(tabs)) {
                widget.tabsObj = tabs.reduce((obj: any, tab) => {
                  tab.widgetId = widgetIdMap[tab.widgetId];
                  obj[tab.id] = tab;
                  return obj;
                }, {});
              }
            } catch (error) {
              log.debug("Error updating tabs", error);
            }
          }

          // Update the table widget column properties
          if (
            widget.type === "TABLE_WIDGET_V2" ||
            widget.type === "TABLE_WIDGET"
          ) {
            try {
              // If the primaryColumns of the table exist
              if (widget.primaryColumns) {
                // For each column
                for (const [columnId, column] of Object.entries(
                  widget.primaryColumns,
                )) {
                  // For each property in the column
                  for (const [key, value] of Object.entries(
                    column as ColumnProperties,
                  )) {
                    // Replace reference of previous widget with the new widgetName
                    // This handles binding scenarios like `{{Table2.tableData.map((currentRow) => (currentRow.id))}}`
                    widget.primaryColumns[columnId][key] = isString(value)
                      ? value.replace(`${oldWidgetName}.`, `${newWidgetName}.`)
                      : value;
                  }
                }
              }
              // Use the new widget name we used to replace the column properties above.
              widget.widgetName = newWidgetName;
            } catch (error) {
              log.debug("Error updating table widget properties", error);
            }
          }

          // TODO: here to move this to the widget definition
          // Update the Select widget defaultValue properties
          if (
            widget.type === "MULTI_SELECT_WIDGET_V2" ||
            widget.type === "SELECT_WIDGET"
          ) {
            try {
              // If the defaultOptionValue exist
              if (widget.defaultOptionValue) {
                const value = widget.defaultOptionValue;
                // replace All occurrence of old widget name
                widget.defaultOptionValue = isString(value)
                  ? value.replaceAll(`${oldWidgetName}.`, `${newWidgetName}.`)
                  : value;
              }
              // Use the new widget name we used to replace the defaultValue properties above.
              widget.widgetName = newWidgetName;
            } catch (error) {
              log.debug("Error updating widget properties", error);
            }
          }

          // If it is the copied widget, update position properties
          if (widget.widgetId === widgetIdMap[copiedWidget.widgetId]) {
            //when the widget is a modal widget, it has to paste on the main container
            const pastingParentId =
              widget.type === "MODAL_WIDGET"
                ? MAIN_CONTAINER_WIDGET_ID
                : pastingIntoWidgetId;
            const {
              bottomRow,
              leftColumn,
              rightColumn,
              topRow,
            } = newWidgetPosition;
            widget.leftColumn = leftColumn;
            widget.topRow = topRow;
            widget.bottomRow = bottomRow;
            widget.rightColumn = rightColumn;
            widget.parentId = pastingParentId;
            // Also, update the parent widget in the canvas widgets
            // to include this new copied widget's id in the parent's children
            let parentChildren = [widget.widgetId];
            const widgetChildren = widgets[pastingParentId].children;
            if (widgetChildren && Array.isArray(widgetChildren)) {
              // Add the new child to existing children
              parentChildren = parentChildren.concat(widgetChildren);
            }

            widgets = {
              ...widgets,
              [pastingParentId]: {
                ...widgets[pastingParentId],
                children: parentChildren,
              },
            };
            // If the copied widget's boundaries exceed the parent's
            // Make the parent scrollable
            if (
              widgets[pastingParentId].bottomRow *
                widgets[widget.parentId].parentRowSpace <=
                widget.bottomRow * widget.parentRowSpace &&
              !widget.detachFromLayout
            ) {
              const parentOfPastingWidget = widgets[pastingParentId].parentId;
              if (
                parentOfPastingWidget &&
                widget.parentId !== MAIN_CONTAINER_WIDGET_ID
              ) {
                const parent = widgets[parentOfPastingWidget];
                widgets[parentOfPastingWidget] = {
                  ...parent,
                  shouldScrollContents: true,
                };
              }
            }
          } else {
            // For all other widgets in the list
            // (These widgets will be descendants of the copied widget)
            // This means, that their parents will also be newly copied widgets
            // Update widget's parent widget ids with the new parent widget ids
            const newParentId = newWidgetList.find((newWidget) =>
              widget.parentId
                ? newWidget.widgetId === widgetIdMap[widget.parentId]
                : false,
            )?.widgetId;
            if (newParentId) widget.parentId = newParentId;
          }
          // Generate a new unique widget name
          if (!shouldGroup) {
            widget.widgetName = newWidgetName;
          }

          widgetNameMap[oldWidgetName] = widget.widgetName;
          // Add the new widget to the canvas widgets
          widgets[widget.widgetId] = widget;
        }
        newlyCreatedWidgetIds.push(widgetIdMap[copiedWidgetId]);
        // 1. updating template in the copied widget and deleting old template associations
        // 2. updating dynamicBindingPathList in the copied grid widget
        for (let i = 0; i < newWidgetList.length; i++) {
          const widget = newWidgetList[i];

          widgets = handleSpecificCasesWhilePasting(
            widget,
            widgets,
            widgetNameMap,
            newWidgetList,
          );
        }
      }),
    ),
  );

  //calculate the new positions of the reflowed widgets
  const reflowedWidgets = getReflowedPositions(
    widgets,
    gridProps,
    reflowedMovementMap,
  );

  // some widgets need to update property of parent if the parent have CHILD_OPERATIONS
  // so here we are traversing up the tree till we get to MAIN_CONTAINER_WIDGET_ID
  // while traversing, if we find any widget which has CHILD_OPERATION, we will call the fn in it
  const updatedWidgets: CanvasWidgetsReduxState = yield call(
    traverseTreeAndExecuteBlueprintChildOperations,
    reflowedWidgets[pastingIntoWidgetId],
    newlyCreatedWidgetIds.filter(
      (widgetId) => !reflowedWidgets[widgetId]?.detachFromLayout,
    ),
    reflowedWidgets,
  );
  yield put(updateAndSaveLayout(updatedWidgets));

  const pageId: string = yield select(getCurrentPageId);

  if (copiedWidgetGroups && copiedWidgetGroups.length > 0) {
    history.push(builderURL({ pageId }));
  }

  yield put({
    type: ReduxActionTypes.RECORD_RECENTLY_ADDED_WIDGET,
    payload: newlyCreatedWidgetIds,
  });
  yield put(generateAutoHeightLayoutTreeAction(true, true));

  //if pasting at the bottom of the canvas, then flash it.
  if (shouldGroup || !newPastingPositionMap) {
    flashElementsById(newlyCreatedWidgetIds, 100);
  }

  yield put(
    selectWidgetInitAction(
      SelectionRequestType.Multiple,
      newlyCreatedWidgetIds,
    ),
  );
}

function* cutWidgetSaga() {
  const allWidgets: { [widgetId: string]: FlattenedWidgetProps } = yield select(
    getWidgets,
  );
  const selectedWidgets: string[] = yield select(getSelectedWidgets);
  if (!selectedWidgets) {
    Toaster.show({
      text: createMessage(ERROR_WIDGET_CUT_NO_WIDGET_SELECTED),
      variant: Variant.info,
    });
    return;
  }

  const allAllowedToCut = selectedWidgets.some((each) => {
    return allWidgets[each] && !allWidgets[each].disallowCopy;
  });

  if (!allAllowedToCut) {
    Toaster.show({
      text: createMessage(ERROR_WIDGET_CUT_NOT_ALLOWED),
      variant: Variant.info,
    });
    return;
  }

  const selectedWidgetProps = selectedWidgets.map((each) => allWidgets[each]);

  const saveResult: boolean = yield createSelectedWidgetsCopy(
    selectedWidgetProps,
  );

  selectedWidgetProps.forEach((each) => {
    const eventName = "WIDGET_CUT_VIA_SHORTCUT"; // cut only supported through a shortcut
    AnalyticsUtil.logEvent(eventName, {
      widgetName: each.widgetName,
      widgetType: each.type,
    });
  });

  if (saveResult) {
    Toaster.show({
      text: createMessage(
        WIDGET_CUT,
        selectedWidgetProps.length > 1
          ? `${selectedWidgetProps.length} Widgets`
          : selectedWidgetProps[0].widgetName,
      ),
      variant: Variant.success,
    });
  }

  yield put({
    type: WidgetReduxActionTypes.WIDGET_DELETE,
    payload: {
      disallowUndo: true,
      isShortcut: true,
    },
  });
}

function* addSuggestedWidget(action: ReduxAction<Partial<WidgetProps>>) {
  const widgetConfig = action.payload;

  if (!widgetConfig.type) return;

  const defaultConfig = WidgetFactory.widgetConfigMap.get(widgetConfig.type);

  const evalTree: DataTree = yield select(getDataTree);
  const widgets: CanvasWidgetsReduxState = yield select(getWidgets);

  const widgetName = getNextWidgetName(widgets, widgetConfig.type, evalTree);

  try {
    let newWidget = {
      newWidgetId: generateReactKey(),
      widgetId: "0",
      parentId: "0",
      renderMode: RenderModes.CANVAS,
      isLoading: false,
      ...defaultConfig,
      widgetName,
      ...widgetConfig,
    };

    const {
      bottomRow,
      leftColumn,
      rightColumn,
      topRow,
    } = yield calculateNewWidgetPosition(
      newWidget as WidgetProps,
      MAIN_CONTAINER_WIDGET_ID,
      widgets,
    );

    newWidget = {
      ...newWidget,
      leftColumn,
      topRow,
      rightColumn,
      bottomRow,
      parentRowSpace: GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
    };

    yield put({
      type: WidgetReduxActionTypes.WIDGET_ADD_CHILD,
      payload: newWidget,
    });

    const pageId: string = yield select(getCurrentPageId);

    navigateToCanvas(pageId);
  } catch (error) {
    log.error(error);
  }
}

/**
 * saga to group selected widgets into a new container
 *
 * @param action
 */
export function* groupWidgetsSaga() {
  const selectedWidgetIDs: string[] = yield select(getSelectedWidgets);
  const isMultipleWidgetsSelected = selectedWidgetIDs.length > 1;

  if (isMultipleWidgetsSelected) {
    try {
      yield put({
        type: ReduxActionTypes.PASTE_COPIED_WIDGET_INIT,
        payload: {
          groupWidgets: true,
        },
      });
    } catch (error) {
      log.error(error);
    }
  }
}

function* widgetBatchUpdatePropertySaga() {
  /*
   * BATCH_UPDATE_WIDGET_PROPERTY should be processed serially as
   * it updates the state. We want the state updates from previous
   * batch update to be flushed out to the store before processing
   * the another batch update.
   */
  const batchUpdateWidgetPropertyChannel: unknown = yield actionChannel(
    ReduxActionTypes.BATCH_UPDATE_WIDGET_PROPERTY,
  );

  while (true) {
    // @ts-expect-error: Type mismatch
    const action: unknown = yield take(batchUpdateWidgetPropertyChannel);
    // @ts-expect-error: Type mismatch
    yield call(batchUpdateWidgetPropertySaga, action);
  }
}

export default function* widgetOperationSagas() {
  yield fork(widgetAdditionSagas);
  yield fork(widgetDeletionSagas);
  yield fork(widgetSelectionSagas);
  yield fork(widgetBatchUpdatePropertySaga);
  yield all([
    takeEvery(ReduxActionTypes.ADD_SUGGESTED_WIDGET, addSuggestedWidget),
    takeLatest(WidgetReduxActionTypes.WIDGET_RESIZE, resizeSaga),
    takeEvery(
      ReduxActionTypes.UPDATE_WIDGET_PROPERTY_REQUEST,
      updateWidgetPropertySaga,
    ),
    takeEvery(
      WidgetReduxActionTypes.WIDGET_UPDATE_PROPERTY,
      updateWidgetPropertySaga,
    ),
    takeEvery(
      ReduxActionTypes.SET_WIDGET_DYNAMIC_PROPERTY,
      setWidgetDynamicPropertySaga,
    ),
    takeEvery(
      ReduxActionTypes.RESET_CHILDREN_WIDGET_META,
      resetChildrenMetaSaga,
    ),
    takeEvery(
      ReduxActionTypes.BATCH_UPDATE_MULTIPLE_WIDGETS_PROPERTY,
      batchUpdateMultipleWidgetsPropertiesSaga,
    ),
    takeEvery(
      ReduxActionTypes.DELETE_WIDGET_PROPERTY,
      deleteWidgetPropertySaga,
    ),
    takeLatest(ReduxActionTypes.UPDATE_CANVAS_SIZE, updateCanvasSize),
    takeLatest(ReduxActionTypes.COPY_SELECTED_WIDGET_INIT, copyWidgetSaga),
    takeLeading(ReduxActionTypes.PASTE_COPIED_WIDGET_INIT, pasteWidgetSaga),
    takeEvery(ReduxActionTypes.CUT_SELECTED_WIDGET, cutWidgetSaga),
    takeEvery(ReduxActionTypes.GROUP_WIDGETS_INIT, groupWidgetsSaga),
    takeEvery(ReduxActionTypes.HANDLE_ALIGN_WIDGETS, handleAlignWidgets),
  ]);
}
