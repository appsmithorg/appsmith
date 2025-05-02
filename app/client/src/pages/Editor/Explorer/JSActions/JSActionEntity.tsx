import React, { memo, useCallback } from "react";
import Entity, { EntityClassNames } from "../Entity";
import history, { NavigationMethod } from "utils/history";
import JSCollectionEntityContextMenu from "./JSActionContextMenu";
import { useSelector } from "react-redux";
import { getJsCollectionByBaseId } from "ee/selectors/entitiesSelector";
import type { DefaultRootState } from "react-redux";
import type { JSCollection } from "entities/JSCollection";
import { JsFileIconV2 } from "../ExplorerIcons";
import { jsCollectionIdURL } from "ee/RouteBuilder";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { useLocation } from "react-router";
import {
  getHasDeleteActionPermission,
  getHasManageActionPermission,
} from "ee/utils/BusinessFeatures/permissionPageHelpers";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { saveJSObjectNameBasedOnIdeType } from "ee/actions/helpers";
import { convertToBaseParentEntityIdSelector } from "selectors/pageListSelectors";
import { getIDETypeByUrl } from "ee/entities/IDE/utils";

interface ExplorerJSCollectionEntityProps {
  step: number;
  searchKeyword?: string;
  baseCollectionId: string;
  isActive: boolean;
  parentEntityId: string;
}

export const ExplorerJSCollectionEntity = memo(
  (props: ExplorerJSCollectionEntityProps) => {
    const jsAction = useSelector((state: DefaultRootState) =>
      getJsCollectionByBaseId(state, props.baseCollectionId),
    ) as JSCollection;
    const location = useLocation();
    const { parentEntityId } = props;
    const baseParentEntityId = useSelector((state) =>
      convertToBaseParentEntityIdSelector(state, parentEntityId),
    );
    const ideType = getIDETypeByUrl(location.pathname);

    const navigateToUrl = jsCollectionIdURL({
      baseParentEntityId,
      baseCollectionId: jsAction.baseId,
      params: {},
    });
    const navigateToJSCollection = useCallback(() => {
      if (jsAction.baseId) {
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
    }, [baseParentEntityId, jsAction.baseId, jsAction.name, location.pathname]);

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
          saveJSObjectNameBasedOnIdeType(id, name, ideType)
        }
      />
    );
  },
);

ExplorerJSCollectionEntity.displayName = "ExplorerJSCollectionEntity";

export default ExplorerJSCollectionEntity;
