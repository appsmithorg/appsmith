import { all, call, takeEvery } from "redux-saga/effects";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import EntityNavigationFactory from "pages/Editor/EntityNavigation/factory";
import type { EntityInfo } from "pages/Editor/EntityNavigation/types";

function* navigateEntitySaga(action: ReduxAction<EntityInfo>) {
  const paneNavigation = EntityNavigationFactory.create(action.payload);
  yield call(paneNavigation.init);
  yield call(paneNavigation.navigate);
}

// function* navigateEntitySaga(
//   action: ReduxAction<{ type: ENTITY_TYPE; id: string }>,
// ) {
//   const { payload } = action;
//   yield put(selectWidgetInitAction(SelectionRequestType.One, [payload.id]));

//   const styleConfig = WidgetFactory.getWidgetPropertyPaneStyleConfig(
//     payload.widgetType,
//   );
//   const widgetProps: WidgetProps = yield select(getWidgetByID(payload.id));

//   const panelNavigationConfig:
//     | {
//         index: number;
//         styleChildren: any;
//       }
//     | undefined = yield call(
//     checkIfPanelConfig,
//     WidgetFactory.getWidgetPropertyPaneContentConfig(payload.widgetType),
//     payload.propertyPath,
//     widgetProps,
//   );

//   let styleNavigationConfig: {
//     index: number;
//     propertyPath?: string;
//   } = {
//     index: 0,
//   };

//   console.log(
//     `${payload.name}.${payload.propertyPath.split(".")[0]}`,
//     "panelSelected - DEBUGGER",
//   );

//   console.log(panelNavigationConfig, "panelNavigationConfig");

//   if (panelNavigationConfig) {
//     yield put(
//       setSelectedPropertyPanel(
//         `${payload.name}.${payload.propertyPath.split(".")[0]}`,
//         panelNavigationConfig.index,
//       ),
//     );
//     styleNavigationConfig = yield call(
//       checkIfPropertyExists,
//       panelNavigationConfig.styleChildren,
//       payload.propertyPath.split(".")[2],
//     );
//     styleNavigationConfig = {
//       ...styleNavigationConfig,
//       propertyPath: `${payload.name}.${payload.propertyPath
//         .split(".")
//         .slice(0, 2)
//         .join(".")}`,
//     };
//   } else {
//     styleNavigationConfig = yield call(
//       checkIfPropertyExists,
//       styleConfig,
//       payload.propertyPath,
//     );
//   }

//   yield delay(500);

//   yield put(
//     setSelectedPropertyTabIndex(
//       styleNavigationConfig.index,
//       styleNavigationConfig.propertyPath,
//     ),
//   );
//   yield delay(500);
//   const element = document.getElementById(
//     btoa(`${payload.id}.${payload.propertyPath}`),
//   );
//   console.log(payload.propertyPath, "property- DEBUGGER");
//   const propertyPaneElement = getPropertyControlFocusElement(element);
//   console.log(propertyPaneElement, "propertyPaneElement- DEBUGGER");
//   propertyPaneElement?.scrollIntoView({
//     block: "center",
//     behavior: "smooth",
//   });
// }

// function checkIfPropertyExists(config: any, propertyPath: string) {
//   console.log(config, "property pane config - DEBUGGER");

//   for (let section = 0; section < config.length; section++) {
//     for (
//       let children = 0;
//       children < config[section].children.length;
//       children++
//     ) {
//       if (config[section].children[children].propertyName === propertyPath) {
//         return {
//           index: 1,
//         };
//       }
//     }
//   }

//   return {
//     index: 0,
//   };
// }

// function checkIfPanelConfig(
//   config: any,
//   propertyPath: string,
//   widgetProps: any,
// ) {
//   for (let section = 0; section < config.length; section++) {
//     for (
//       let children = 0;
//       children < config[section].children.length;
//       children++
//     ) {
//       const fieldConfig = config[section].children[children];

//       if (
//         fieldConfig.propertyName === propertyPath.split(".")[0] &&
//         fieldConfig.hasOwnProperty("panelConfig")
//       ) {
//         return {
//           index: get(widgetProps, propertyPath.split(".").slice(0, 2).join("."))
//             .index,
//           styleChildren: get(fieldConfig, "panelConfig.styleChildren"),
//         };
//       }
//     }
//   }
// }

export default function* navigationSagas() {
  yield all([
    takeEvery(ReduxActionTypes.NAVIGATE_TO_ENTITY, navigateEntitySaga),
  ]);
}
