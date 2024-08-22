import { useCallback, useMemo } from "react";
import React from "react";

import { ENTITY_TYPE } from "ee/entities/AppsmithConsole/utils";
import type { WidgetEntity } from "ee/entities/DataTree/types";
import type { AppState } from "ee/reducers";
import { getAction, getDatasource } from "ee/selectors/entitiesSelector";
import {
  isAction,
  isJSAction,
  isWidget,
} from "ee/workers/Evaluation/evaluationUtils";
import { isStoredDatasource } from "entities/Action";
import equal from "fast-deep-equal/es6";
import { keyBy } from "lodash";
import { getPluginIcon, jsIcon } from "pages/Editor/Explorer/ExplorerIcons";
import WidgetIcon from "pages/Editor/Explorer/Widgets/WidgetIcon";
import { useSelector } from "react-redux";
import { getFilteredErrors } from "selectors/debuggerSelectors";

import { doesEntityHaveErrors } from "../helpers";

export const useGetEntityInfo = (name: string) => {
  const entity = useSelector((state: AppState) => state.evaluations.tree[name]);
  const debuggerErrors = useSelector(getFilteredErrors);
  const action = useSelector((state: AppState) =>
    isAction(entity) ? getAction(state, entity.actionId) : undefined,
  );
  const plugins = useSelector((state: AppState) => {
    return state.entities.plugins.list;
  }, equal);
  const pluginGroups = useMemo(() => keyBy(plugins, "id"), [plugins]);
  const icon = action && getPluginIcon(pluginGroups[action.pluginId]);
  const datasource = useSelector((state: AppState) =>
    action && isStoredDatasource(action.datasource)
      ? getDatasource(state, action.datasource.id)
      : undefined,
  );

  const getEntityInfo = useCallback(() => {
    if (isWidget(entity)) {
      const widgetEntity = entity as WidgetEntity;
      const icon = <WidgetIcon type={entity.type} />;
      const hasError = doesEntityHaveErrors(
        widgetEntity.widgetId,
        debuggerErrors,
      );

      return {
        name,
        icon,
        hasError,
        type: ENTITY_TYPE.WIDGET,
        entityType: widgetEntity.type,
      };
    } else if (isAction(entity)) {
      const hasError = doesEntityHaveErrors(entity.actionId, debuggerErrors);

      return {
        name,
        icon,
        datasourceName: datasource?.name ?? "",
        hasError,
        type: ENTITY_TYPE.ACTION,
        entityType: action?.pluginId ? pluginGroups[action.pluginId].name : "",
      };
    } else if (isJSAction(entity)) {
      const hasError = doesEntityHaveErrors(entity.actionId, debuggerErrors);
      const icon = jsIcon;
      return {
        name,
        icon,
        hasError,
        type: ENTITY_TYPE.JSACTION,
        entityType: entity.type,
      };
    }
  }, [name]);

  return getEntityInfo;
};
