import React, { ReactNode, useCallback, memo } from "react";
import Entity, { EntityClassNames } from "../Entity";
import ActionEntityContextMenu from "./ActionEntityContextMenu";
import history from "utils/history";
import { saveActionName } from "actions/actionActions";
import EntityProperties from "../Entity/EntityProperties";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import { ExplorerURLParams } from "../helpers";
import { useParams } from "react-router";

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
    props.url && history.push(props.url);
  }, [props.url]);

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
      isDefaultExpanded={props.active}
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
        isCurrentPage={props.pageId === pageId}
        step={props.step + 1}
        entity={props.action}
      />
    </Entity>
  );
});

ExplorerActionEntity.displayName = "ExplorerActionEntity";

export default ExplorerActionEntity;
