import React, { memo, useCallback } from "react";
import Entity, { EntityClassNames } from "../Entity";
import history, { NavigationMethod } from "utils/history";
import JSCollectionEntityContextMenu from "./JSActionContextMenu";
import { saveJSObjectName } from "actions/jsActionActions";
import { useSelector } from "react-redux";
import { getCurrentPageId } from "selectors/editorSelectors";
import { getJSCollection } from "selectors/entitiesSelector";
import { AppState } from "@appsmith/reducers";
import { JSCollection } from "entities/JSCollection";
import { JsFileIconV2 } from "../ExplorerIcons";
import { PluginType } from "entities/Action";
import { jsCollectionIdURL } from "RouteBuilder";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { useLocation } from "react-router";
import {
  hasDeleteActionPermission,
  hasManageActionPermission,
} from "@appsmith/utils/permissionHelpers";

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
        history.push(navigateToUrl, {
          invokedBy: NavigationMethod.EntityExplorer,
        });
      }
    }, [pageId, jsAction.id, jsAction.name, location.pathname]);

    const jsActionPermissions = jsAction.userPermissions || [];

    const canDeleteJSAction = hasDeleteActionPermission(jsActionPermissions);

    const canManageJSAction = hasManageActionPermission(jsActionPermissions);

    const contextMenu = (
      <JSCollectionEntityContextMenu
        canDelete={canDeleteJSAction}
        canManage={canManageJSAction}
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
        canEditEntityName={canManageJSAction}
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
