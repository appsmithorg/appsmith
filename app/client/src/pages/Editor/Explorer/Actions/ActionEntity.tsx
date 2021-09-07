import React, { ReactNode, useCallback, memo } from "react";
import Entity, { EntityClassNames } from "../Entity";
import ActionEntityContextMenu from "./ActionEntityContextMenu";
import history from "utils/history";
import { saveActionName } from "actions/pluginActionActions";
import EntityProperties from "../Entity/EntityProperties";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import { useParams } from "react-router";
import { ExplorerURLParams } from "../helpers";

const getUpdateActionNameReduxAction = (id: string, name: string) => {
  return saveActionName({ id, name });
};

type ExplorerActionEntityProps = {
  action: any;
  url: string;
  icon: ReactNode;
  active: boolean;
  step: number;
  searchKeyword?: string;
  pageId: string;
};

export const ExplorerActionEntity = memo((props: ExplorerActionEntityProps) => {
  const { pageId } = useParams<ExplorerURLParams>();
  const switchToAction = useCallback(() => {
    PerformanceTracker.startTracking(PerformanceTransactionName.OPEN_ACTION, {
      url: props.url,
    });
    props.url && history.push(props.url);
  }, [props.url, pageId, props.pageId]);

  const contextMenu = (
    <ActionEntityContextMenu
      className={EntityClassNames.CONTEXT_MENU}
      id={props.action.config.id}
      name={props.action.config.name}
      pageId={props.pageId}
    />
  );
  return (
    <Entity
      action={switchToAction}
      active={props.active}
      className="action"
      contextMenu={contextMenu}
      entityId={props.action.config.id}
      icon={props.icon}
      key={props.action.config.id}
      name={props.action.config.name}
      searchKeyword={props.searchKeyword}
      step={props.step}
      updateEntityName={getUpdateActionNameReduxAction}
    >
      <EntityProperties
        entity={props.action}
        entityId={props.action.config.id}
        entityName={props.action.config.name}
        entityType={ENTITY_TYPE.ACTION}
        pageId={props.pageId}
        step={props.step + 1}
      />
    </Entity>
  );
});

ExplorerActionEntity.displayName = "ExplorerActionEntity";

export default ExplorerActionEntity;
