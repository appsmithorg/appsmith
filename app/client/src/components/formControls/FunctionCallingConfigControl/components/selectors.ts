import { objectKeys } from "@appsmith/utils";
import {
  CLEAR_INTERVAL,
  CLEAR_STORE,
  CLOSE_MODAL,
  COPY_TO_CLIPBOARD,
  DOWNLOAD,
  GET_GEO_LOCATION,
  NAVIGATE_TO,
  POST_MESSAGE,
  REMOVE_VALUE,
  RESET_WIDGET,
  SET_INTERVAL,
  SHOW_ALERT,
  SHOW_MODAL,
  STOP_WATCH_GEO_LOCATION,
  STORE_VALUE,
  WATCH_GEO_LOCATION,
  createMessage,
} from "ee/constants/messages";
import { APPSMITH_NAMESPACED_FUNCTIONS as EE_APPSMITH_NAMESPACED_FUNCTIONS } from "ee/entities/Engine/actionHelpers";
import type { AppState } from "ee/reducers";
import {
  getActions,
  getJSCollections,
  getPlugins,
} from "ee/selectors/entitiesSelector";
import {
  APPSMITH_GLOBAL_FUNCTIONS,
  APPSMITH_NAMESPACED_FUNCTIONS,
} from "../../../editorComponents/ActionCreator/constants";
import type {
  FunctionCallingEntityTypeOption,
  FunctionCallingEntityType,
} from "../types";
import { createSelector } from "reselect";

export const selectQueryEntityOptions = (
  state: AppState,
): FunctionCallingEntityTypeOption[] => {
  const plugins = getPlugins(state);

  return (
    getActions(state)
      // TODO: Remove filtering once AIChat is a separate entity
      .filter(
        (action) =>
          action.config.pluginType !== "AI" &&
          // @ts-expect-error No way to narrow down proper type
          action.config.pluginName !== "Appsmith AI",
      )
      .map(({ config }) => ({
        id: config.id,
        name: config.name,
        pluginId: config.pluginId,
      }))
      .map((action) => {
        const iconSrc = plugins.find(
          (plugin) => plugin.id === action.pluginId,
        )?.iconLocation;

        return {
          value: action.id,
          label: action.name,
          optionGroupType: "Query",
          iconSrc,
        };
      })
  );
};

const selectJsFunctionEntityOptions = (
  state: AppState,
): FunctionCallingEntityTypeOption[] => {
  return getJSCollections(state).flatMap((jsCollection) => {
    return jsCollection.config.actions.map((jsFunction) => {
      return {
        value: jsFunction.id,
        label: jsFunction.name,
        optionGroupType: "JSFunction",
      };
    });
  });
};

const selectSystemFunctionEntityOptions =
  (): FunctionCallingEntityTypeOption[] => {
    const systemFunctions = {
      ...APPSMITH_GLOBAL_FUNCTIONS,
      ...APPSMITH_NAMESPACED_FUNCTIONS,
      ...EE_APPSMITH_NAMESPACED_FUNCTIONS,
    } as const;

    const labelMap: Record<
      keyof Omit<typeof systemFunctions, "assignRequest">,
      string
    > = {
      navigateTo: createMessage(NAVIGATE_TO),
      showAlert: createMessage(SHOW_ALERT),
      showModal: createMessage(SHOW_MODAL),
      closeModal: createMessage(CLOSE_MODAL),
      storeValue: createMessage(STORE_VALUE),
      removeValue: createMessage(REMOVE_VALUE),
      clearStore: createMessage(CLEAR_STORE),
      download: createMessage(DOWNLOAD),
      copyToClipboard: createMessage(COPY_TO_CLIPBOARD),
      resetWidget: createMessage(RESET_WIDGET),
      setInterval: createMessage(SET_INTERVAL),
      clearInterval: createMessage(CLEAR_INTERVAL),
      getGeolocation: createMessage(GET_GEO_LOCATION),
      watchGeolocation: createMessage(WATCH_GEO_LOCATION),
      stopWatchGeolocation: createMessage(STOP_WATCH_GEO_LOCATION),
      postWindowMessage: createMessage(POST_MESSAGE),
    };

    return (
      objectKeys(systemFunctions)
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore assignRequest doesn't exist in CE repo but added in EE repo
        .filter((name) => name !== "assignRequest")
        .map((name) => ({
          value: name,
          label: labelMap[name],
          optionGroupType: "SystemFunction",
        }))
    );
  };

export const selectEntityOptions = createSelector(
  selectQueryEntityOptions,
  selectJsFunctionEntityOptions,
  selectSystemFunctionEntityOptions,
  (
    queryItems,
    jsItems,
    systemItems,
  ): Record<FunctionCallingEntityType, FunctionCallingEntityTypeOption[]> => {
    return {
      Query: queryItems,
      JSFunction: jsItems,
      SystemFunction: systemItems,
    };
  },
);
