import React, { ReactNode, useCallback, memo } from "react";
import Entity, { EntityClassNames } from "../Entity";
import ActionEntityContextMenu from "./ActionEntityContextMenu";
import history from "utils/history";
import { saveActionName } from "actions/actionActions";
import EntityProperties from "../Entity/EntityProperties";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import { fetchPage } from "actions/pageActions";
import { useParams } from "react-router";
import { ExplorerURLParams } from "../helpers";
import { useDispatch } from "react-redux";

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
  const dispatch = useDispatch();
  const switchToAction = useCallback(() => {
    PerformanceTracker.startTracking(PerformanceTransactionName.OPEN_ACTION, {
      url: props.url,
    });
    props.url && history.push(props.url);

    if (pageId !== props.pageId) {
      dispatch(fetchPage(props.pageId));
    }
  }, [props.url, pageId, props.pageId]);

  const contextMenu = (
    <ActionEntityContextMenu
      id={props.action.config.id}
      name={props.action.config.name}
      className={EntityClassNames.CONTEXT_MENU}
      pageId={props.pageId}
    />
  );
  return (
    <Entity
      key={props.action.config.id}
      icon={props.icon}
      name={props.action.config.name}
      action={switchToAction}
      active={props.active}
      entityId={props.action.config.id}
      step={props.step}
      updateEntityName={getUpdateActionNameReduxAction}
      searchKeyword={props.searchKeyword}
      contextMenu={contextMenu}
      className="action"
    >
      <EntityProperties
        entityName={props.action.config.name}
        entityType={ENTITY_TYPE.ACTION}
        pageId={props.pageId}
        step={props.step + 1}
        entity={props.action}
        entityId={props.action.config.id}
      />
    </Entity>
  );
});

ExplorerActionEntity.displayName = "ExplorerActionEntity";

export default ExplorerActionEntity;
