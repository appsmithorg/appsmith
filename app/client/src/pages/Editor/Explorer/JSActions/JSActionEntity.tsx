import React, { memo, useCallback } from "react";
import Entity, { EntityClassNames } from "../Entity";
import history from "utils/history";
import JSCollectionEntityContextMenu from "./JSActionContextMenu";
import { saveJSObjectName } from "actions/jsActionActions";
import { useSelector } from "react-redux";
import { getCurrentPageId } from "selectors/editorSelectors";
import { getJSCollection } from "selectors/entitiesSelector";
import { AppState } from "reducers";
import { JSCollection } from "entities/JSCollection";
import { JsFileIconV2 } from "../ExplorerIcons";
import { PluginType } from "entities/Action";
import { jsCollectionIdURL } from "RouteBuilder";

type ExplorerJSCollectionEntityProps = {
  step: number;
  searchKeyword?: string;
  id: string;
  isActive: boolean;
  type: PluginType;
};

const getUpdateJSObjectName = (id: string, name: string) => {
  return saveJSObjectName({ id, name });
};

export const ExplorerJSCollectionEntity = memo(
  (props: ExplorerJSCollectionEntityProps) => {
    const pageId = useSelector(getCurrentPageId) as string;
    const jsAction = useSelector((state: AppState) =>
      getJSCollection(state, props.id),
    ) as JSCollection;
    const navigateToJSCollection = useCallback(() => {
      if (jsAction.id) {
        history.push(
          jsCollectionIdURL({ pageId, collectionId: jsAction.id, params: {} }),
        );
      }
    }, [pageId, jsAction.id]);
    const contextMenu = (
      <JSCollectionEntityContextMenu
        className={EntityClassNames.CONTEXT_MENU}
        id={jsAction.id}
        name={jsAction.name}
        pageId={pageId}
      />
    );
    return (
      <Entity
        action={navigateToJSCollection}
        active={props.isActive}
        className="t--jsaction"
        contextMenu={contextMenu}
        entityId={jsAction.id}
        icon={JsFileIconV2}
        key={jsAction.id}
        name={jsAction.name}
        searchKeyword={props.searchKeyword}
        step={props.step}
        updateEntityName={getUpdateJSObjectName}
      />
    );
  },
);

ExplorerJSCollectionEntity.displayName = "ExplorerJSCollectionEntity";

export default ExplorerJSCollectionEntity;
