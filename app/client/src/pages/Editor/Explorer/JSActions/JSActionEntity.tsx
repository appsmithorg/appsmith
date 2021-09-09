import React, { ReactNode, memo, useCallback } from "react";
import Entity, { EntityClassNames } from "../Entity";
import EntityProperties from "../Entity/EntityProperties";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import { JS_COLLECTION_ID_URL } from "constants/routes";
import history from "utils/history";
import { ExplorerURLParams } from "../helpers";
import { useParams } from "react-router";
import JSCollectionEntityContextMenu from "./JSActionContextMenu";
import { getJSCollectionIdFromURL } from "../helpers";
import { saveJSObjectName } from "actions/jsActionActions";
import { JSCollectionData } from "reducers/entityReducers/jsActionsReducer";

type ExplorerJSCollectionEntityProps = {
  action: JSCollectionData;
  icon: ReactNode;
  step: number;
  searchKeyword?: string;
  pageId: string;
};

const getUpdateJSObjectName = (id: string, name: string) => {
  return saveJSObjectName({ id, name });
};

export const ExplorerJSCollectionEntity = memo(
  (props: ExplorerJSCollectionEntityProps) => {
    const params = useParams<ExplorerURLParams>();
    const navigateToJSCollection = useCallback(() => {
      history.push(
        JS_COLLECTION_ID_URL(
          params.applicationId,
          props.pageId,
          props.action.config.id,
          {},
        ),
      );
    }, [props.pageId]);
    const contextMenu = (
      <JSCollectionEntityContextMenu
        className={EntityClassNames.CONTEXT_MENU}
        id={props.action.config.id}
        name={props.action.config.name}
        pageId={props.pageId}
      />
    );
    const jsactionId = getJSCollectionIdFromURL();
    const active = jsactionId === props.action.config.id;
    return (
      <Entity
        action={navigateToJSCollection}
        active={active}
        className="t--jsaction"
        contextMenu={contextMenu}
        entityId={props.action.config.id}
        icon={props.icon}
        key={props.action.config.id}
        name={props.action.config.name}
        searchKeyword={props.searchKeyword}
        step={props.step}
        updateEntityName={getUpdateJSObjectName}
      >
        <EntityProperties
          entity={props.action}
          entityId={props.action.config.id}
          entityName={props.action.config.name}
          entityType={ENTITY_TYPE.JSACTION}
          pageId={props.pageId}
          step={props.step + 1}
        />
      </Entity>
    );
  },
);

ExplorerJSCollectionEntity.displayName = "ExplorerJSCollectionEntity";

export default ExplorerJSCollectionEntity;
