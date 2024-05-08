import React, { memo, useCallback } from "react";
import Entity, { EntityClassNames } from "../Entity";
import history, { NavigationMethod } from "utils/history";
import JSCollectionEntityContextMenu from "./JSActionContextMenu";
import { useSelector } from "react-redux";
import { getJSCollection } from "@appsmith/selectors/entitiesSelector";
import type { AppState } from "@appsmith/reducers";
import type { JSCollection } from "entities/JSCollection";
import { JsFileIconV2 } from "../ExplorerIcons";
import type { PluginType } from "entities/Action";
import { jsCollectionIdURL } from "@appsmith/RouteBuilder";
import AnalyticsUtil from "@appsmith/utils/AnalyticsUtil";
import { useLocation } from "react-router";
import {
  getHasDeleteActionPermission,
  getHasManageActionPermission,
} from "@appsmith/utils/BusinessFeatures/permissionPageHelpers";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import { saveJSObjectNameBasedOnParentEntity } from "@appsmith/actions/helpers";
import type { ActionParentEntityTypeInterface } from "@appsmith/entities/Engine/actionHelpers";

interface ExplorerJSCollectionEntityProps {
  step: number;
  searchKeyword?: string;
  id: string;
  isActive: boolean;
  type: PluginType;
  parentEntityId: string;
  parentEntityType: ActionParentEntityTypeInterface;
}

const getUpdateJSObjectName = (
  id: string,
  name: string,
  parentEntityType: ActionParentEntityTypeInterface,
) => {
  return saveJSObjectNameBasedOnParentEntity(id, name, parentEntityType);
};

export const ExplorerJSCollectionEntity = memo(
  (props: ExplorerJSCollectionEntityProps) => {
    const jsAction = useSelector((state: AppState) =>
      getJSCollection(state, props.id),
    ) as JSCollection;
    const location = useLocation();
    const { parentEntityId, parentEntityType } = props;
    const navigateToUrl = jsCollectionIdURL({
      parentEntityId,
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
    }, [parentEntityId, jsAction.id, jsAction.name, location.pathname]);

    const jsActionPermissions = jsAction.userPermissions || [];

    const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);

    const canDeleteJSAction = getHasDeleteActionPermission(
      isFeatureEnabled,
      jsActionPermissions,
    );

    const canManageJSAction = getHasManageActionPermission(
      isFeatureEnabled,
      jsActionPermissions,
    );

    const contextMenu = (
      <JSCollectionEntityContextMenu
        canDelete={canDeleteJSAction}
        canManage={canManageJSAction}
        className={EntityClassNames.CONTEXT_MENU}
        hideMenuItems={Boolean(jsAction?.isMainJSCollection)}
        id={jsAction.id}
        name={jsAction.name}
      />
    );
    return (
      <Entity
        action={navigateToJSCollection}
        active={props.isActive}
        canEditEntityName={
          canManageJSAction && !Boolean(jsAction?.isMainJSCollection)
        }
        className="t--jsaction"
        contextMenu={contextMenu}
        entityId={jsAction.id}
        icon={JsFileIconV2(16, 16)}
        key={jsAction.id}
        name={jsAction?.displayName || jsAction.name}
        searchKeyword={props.searchKeyword}
        step={props.step}
        updateEntityName={(id, name) =>
          getUpdateJSObjectName(id, name, parentEntityType)
        }
      />
    );
  },
);

ExplorerJSCollectionEntity.displayName = "ExplorerJSCollectionEntity";

export default ExplorerJSCollectionEntity;
