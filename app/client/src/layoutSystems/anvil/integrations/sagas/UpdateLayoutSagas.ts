// import type { FlattenedWidgetProps } from "WidgetProvider/constants";
// import { updateAndSaveLayout } from "actions/pageActions";
// import {
//   ReduxActionErrorTypes,
//   type ReduxAction,
// } from "@appsmith/constants/ReduxActionConstants";
// import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
// import {
//   getParentUpdatesPostWidgetDeletion,
//   updateAnvilParentPostWidgetDeletion,
// } from "layoutSystems/anvil/utils/layouts/update/deletionUtils";
// import type {
//   CanvasWidgetsReduxState,
//   CrudWidgetsPayload,
//   UpdateWidgetsPayload,
// } from "reducers/entityReducers/canvasWidgetsReducer";
// import { put, select, takeLatest } from "redux-saga/effects";
// import { SectionWidget } from "widgets/anvil/SectionWidget";
// import { AnvilReduxActionTypes } from "../actions/actionTypes";
// import { all } from "axios";
// import { LayoutSystemTypes } from "layoutSystems/types";
// import { getLayoutSystemType } from "selectors/layoutSystemSelectors";
// import { getWidgets } from "sagas/selectors";
// import { crudMultipleWidgets } from "actions/controlActions";

// // function* updateAndSaveAnvilLayoutSaga(
// //   action: ReduxAction<{
// //     isRetry?: boolean;
// //     widgets: CanvasWidgetsReduxState;
// //     shouldReplay?: boolean;
// //     updatedWidgetIds?: string[];
// //   }>,
// // ) {
// //   try {
// //     const { widgets } = action.payload;
// //     const layoutSystemType: LayoutSystemTypes =
// //       yield select(getLayoutSystemType);
// //     if (layoutSystemType !== LayoutSystemTypes.ANVIL || !widgets) {
// //       yield put(updateAndSaveLayout(widgets));
// //     }

// //     let updatedWidgets: CanvasWidgetsReduxState = { ...widgets };

// //     /**
// //      * Extract all section widgets
// //      */
// //     const sections: FlattenedWidgetProps[] = Object.values(widgets).filter(
// //       (each: FlattenedWidgetProps) => each.type === SectionWidget.type,
// //     );

// //     for (const each of sections) {
// //       const children: string[] | undefined = each.children;
// //       /**
// //        * If a section doesn't have any children,
// //        * => delete it.
// //        */
// //       if (!children || !children?.length) {
// //         let parent: FlattenedWidgetProps =
// //           updatedWidgets[each.parentId || MAIN_CONTAINER_WIDGET_ID];
// //         if (parent) {
// //           parent = {
// //             ...parent,
// //             children: parent.children?.filter(
// //               (id: string) => id !== each.widgetId,
// //             ),
// //           };
// //           delete updatedWidgets[each.widgetId];
// //           updatedWidgets = updateAnvilParentPostWidgetDeletion(
// //             { ...updatedWidgets, [parent.widgetId]: parent },
// //             parent.widgetId,
// //             each.widgetId,
// //             each.type,
// //           );
// //         }
// //       } else if (each.zoneCount !== each.children?.length) {
// //         /**
// //          * If section's zone count doesn't match it's child count,
// //          * => update the zone count.
// //          */
// //         updatedWidgets = {
// //           ...updatedWidgets,
// //           [each.widgetId]: {
// //             ...each,
// //             zoneCount: each.children?.length,
// //           },
// //         };
// //       }
// //     }
// //     yield put(updateAndSaveLayout(updatedWidgets));
// //   } catch (error) {
// //     yield put({
// //       type: ReduxActionErrorTypes.WIDGET_OPERATION_ERROR,
// //       payload: {
// //         action: AnvilReduxActionTypes.SAVE_ANVIL_LAYOUT,
// //         error,
// //       },
// //     });
// //   }
// // }

// export function* performAnvilChecksSaga(
//   action: ReduxAction<{
//     updates: CrudWidgetsPayload;
//   }>,
// ) {
//   try {
//     const widgets: CanvasWidgetsReduxState = yield select(getWidgets);
//     const { updates } = action.payload;
//     console.log("#### performAnvilChecks", { updates });
//     const { add, remove, update }: CrudWidgetsPayload = updates;
//     let newUpdates: UpdateWidgetsPayload = { ...update };
//     let newRemove: string[] = [...(remove ?? [])];
//     /**
//      * Section checks
//      */
//     if (update && Object.keys(update).length) {
//       for (const each of Object.keys(update)) {
//         const widget: FlattenedWidgetProps = widgets[each];
//         if (widget.type === SectionWidget.type) {
//           const data = performSectionChecks(
//             widgets,
//             each,
//             newUpdates,
//             newRemove,
//           );
//           newUpdates = data.update;
//           newRemove = data.remove;
//         }
//       }
//     }
//     yield put(
//       crudMultipleWidgets({ add, remove: newRemove, update: newUpdates }),
//     );
//   } catch (error) {
//     yield put({
//       type: ReduxActionErrorTypes.WIDGET_OPERATION_ERROR,
//       payload: {
//         action: AnvilReduxActionTypes.PERFORM_ANVIL_CHECKS_BEFORE_UPDATE,
//         error,
//       },
//     });
//   }
// }

// function performSectionChecks(
//   widgets: CanvasWidgetsReduxState,
//   widgetId: string,
//   update: UpdateWidgetsPayload,
//   remove: string[],
// ): { update: UpdateWidgetsPayload; remove: string[] } {
//   const widget: FlattenedWidgetProps = widgets[widgetId];
//   let children: string[] = widget.children || [];
//   let zoneCount: number = widget.zoneCount;
//   update[widgetId].forEach((eachUpdate) => {
//     const { propertyPath, propertyValue } = eachUpdate;
//     if (propertyPath === "zoneCount") {
//       zoneCount = propertyValue as number;
//     }
//     if (propertyPath === "children") {
//       children = propertyValue as string[];
//     }
//   });

//   if (!children?.length) {
//     /**
//      * If a section doesn't have any children,
//      * => delete it.
//      */
//     remove.push(widgetId);
//     delete update[widgetId];
//     if (widget.parentId && widgets[widget.parentId]) {
//       const parentUpdates: UpdateWidgetsPayload =
//         getParentUpdatesPostWidgetDeletion(
//           widgets,
//           widget.parentId,
//           widgetId,
//           widget.type,
//         );
//       update[widget.parentId] = [
//         ...update[widget.parentId],
//         ...parentUpdates[widget.parentId],
//       ];
//     }
//   } else if (children.length !== zoneCount) {
//     /**
//      * If section's zone count doesn't match it's child count,
//      * => update the zone count.
//      */
//     update[widgetId].push({
//       propertyPath: "zoneCount",
//       propertyValue: children.length,
//     });
//   }
//   return { update, remove };
// }

// export default function* anvilUpdateLayoutSagas() {
//   yield all([
//     // takeLatest(
//     //   AnvilReduxActionTypes.SAVE_ANVIL_LAYOUT,
//     //   updateAndSaveAnvilLayoutSaga,
//     // ),
//     // takeLatest(
//     //   AnvilReduxActionTypes.PERFORM_ANVIL_CHECKS_BEFORE_UPDATE,
//     //   performAnvilChecksSaga,
//     // ),
//   ]);
// }

export const x = 1;
