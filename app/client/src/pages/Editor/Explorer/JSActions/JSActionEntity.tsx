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
import AnalyticsUtil from "utils/AnalyticsUtil";
import { useLocation } from "react-router";

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
    const location = useLocation();
    const navigateToUrl = jsCollectionIdURL({
      pageId,
      collectionId: jsAction.id,
      params: {},
    });
    const navigateToJSCollection = useCallback(() => {
      if (jsAction.id) {
        AnalyticsUtil.logEvent("ENTITY_EXPLORER_CLICK", {
          type: "JSOBJECT",
          fromUrl: location.pathname,
          toUrl: navigateToUrl,
          name: jsAction.name,
        });
        history.push(navigateToUrl);
      }
    }, [pageId, jsAction.id, jsAction.name, location.pathname]);
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
