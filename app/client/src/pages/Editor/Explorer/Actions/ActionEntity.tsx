import React, { useCallback, memo, useMemo } from "react";
import Entity, { EntityClassNames } from "../Entity";
import ActionEntityContextMenu from "./ActionEntityContextMenu";
import history from "utils/history";
import { saveActionName } from "actions/pluginActionActions";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import { useSelector } from "store";
import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import { getAction, getPlugins } from "selectors/entitiesSelector";
import { Action, PluginType } from "entities/Action";
import { keyBy } from "lodash";
import { getActionConfig } from "./helpers";

const getUpdateActionNameReduxAction = (id: string, name: string) => {
  return saveActionName({ id, name });
};

type ExplorerActionEntityProps = {
  step: number;
  searchKeyword?: string;
  id: string;
  type: PluginType;
  isActive: boolean;
};

export const ExplorerActionEntity = memo((props: ExplorerActionEntityProps) => {
  const currentApplicationId = useSelector(getCurrentApplicationId);
  const pageId = useSelector(getCurrentPageId) as string;
  const action = useSelector((state) => getAction(state, props.id)) as Action;
  const plugins = useSelector(getPlugins);
  const pluginGroups = useMemo(() => keyBy(plugins, "id"), [plugins]);

  const config = getActionConfig(props.type);
  const url = config?.getURL(
    currentApplicationId,
    pageId as string,
    action.id,
    action.pluginType,
    pluginGroups[action.pluginId],
  );
  const icon = config?.getIcon(action, pluginGroups[action.pluginId]);

  const switchToAction = useCallback(() => {
    PerformanceTracker.startTracking(PerformanceTransactionName.OPEN_ACTION, {
      url,
    });
    url && history.push(url);
  }, [url]);

  const contextMenu = (
    <ActionEntityContextMenu
      className={EntityClassNames.CONTEXT_MENU}
      id={action.id}
      name={action.name}
      pageId={pageId}
    />
  );
  return (
    <Entity
      action={switchToAction}
      active={props.isActive}
      className="action"
      contextMenu={contextMenu}
      entityId={action.id}
      icon={icon}
      key={action.id}
      name={action.name}
      searchKeyword={props.searchKeyword}
      step={props.step}
      updateEntityName={getUpdateActionNameReduxAction}
    />
  );
});

ExplorerActionEntity.displayName = "ExplorerActionEntity";

export default ExplorerActionEntity;
