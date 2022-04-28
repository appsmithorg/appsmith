import { isStoredDatasource } from "entities/Action";
import { ENTITY_TYPE } from "entities/AppsmithConsole";
import { isEqual, keyBy } from "lodash";
import { getPluginIcon, jsIcon } from "pages/Editor/Explorer/ExplorerIcons";
import { useMemo, useCallback } from "react";
import { AppState } from "reducers";
import { getFilteredErrors } from "selectors/debuggerSelectors";
import { getAction, getDatasource } from "selectors/entitiesSelector";
import { useSelector } from "react-redux";
import { isAction, isJSAction, isWidget } from "workers/evaluationUtils";
import { doesEntityHaveErrors } from "../helpers";
import React from "react";
import WidgetIcon from "pages/Editor/Explorer/Widgets/WidgetIcon";

export const useGetEntityInfo = (name: string) => {
  const entity = useSelector((state: AppState) => state.evaluations.tree[name]);
  const debuggerErrors = useSelector(getFilteredErrors);
  const action = useSelector((state: AppState) =>
    isAction(entity) ? getAction(state, entity.actionId) : undefined,
  );
  const plugins = useSelector((state: AppState) => {
    return state.entities.plugins.list;
  }, isEqual);
  const pluginGroups = useMemo(() => keyBy(plugins, "id"), [plugins]);
  const icon = action && getPluginIcon(pluginGroups[action.pluginId]);
  const datasource = useSelector((state: AppState) =>
    action && isStoredDatasource(action.datasource)
      ? getDatasource(state, action.datasource.id)
      : undefined,
  );

  const getEntityInfo = useCallback(() => {
    if (isWidget(entity)) {
      const icon = <WidgetIcon type={entity.type} />;
      const hasError = doesEntityHaveErrors(entity.widgetId, debuggerErrors);

      return {
        name,
        icon,
        hasError,
        type: ENTITY_TYPE.WIDGET,
        entityType: entity.type,
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
