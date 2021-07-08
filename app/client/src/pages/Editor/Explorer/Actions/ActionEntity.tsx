import React, { ReactNode, useCallback, memo, useMemo } from "react";
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

function CreateContextMenu(props: {
  action: { config: { name: string; id: string } };
  pageId: string;
}) {
  return (
    <ActionEntityContextMenu
      className={EntityClassNames.CONTEXT_MENU}
      id={props.action.config.id}
      name={props.action.config.name}
      pageId={props.pageId}
    />
  );
}

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

  // const contextMenu = (
  //   <ActionEntityContextMenu
  //     id={props.action.config.id}
  //     name={props.action.config.name}
  //     className={EntityClassNames.CONTEXT_MENU}
  //     pageId={props.pageId}
  //   />
  // );
  const contextMenuProps = useMemo(() => {
    console.log("Generating new props");
    return {
      action: {
        config: {
          name: props.action.config.name,
          id: props.action.config.id,
        },
      },
      pageId: props.pageId,
    };
  }, [props.action.config.name, props.action.config.id, props.pageId]);

  return (
    <Entity
      action={switchToAction}
      active={props.active}
      className="action"
      contextMenu={
        <CreateContextMenu
          action={contextMenuProps.action}
          pageId={contextMenuProps.pageId}
        />
      }
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
