import React, { useCallback, useMemo } from "react";
import { EntityItem } from "@appsmith/ads";
import type { AppState } from "ee/reducers";
import { getJsCollectionByBaseId } from "ee/selectors/entitiesSelector";
import { useDispatch, useSelector } from "react-redux";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { getHasManageActionPermission } from "ee/utils/BusinessFeatures/permissionPageHelpers";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import history, { NavigationMethod } from "utils/history";
import { saveJSObjectNameBasedOnIdeType } from "ee/actions/helpers";
import { useNameEditorState } from "pages/Editor/IDE/EditorPane/hooks/useNameEditorState";
import { useValidateEntityName } from "IDE";
import { useLocation } from "react-router";
import { getIDETypeByUrl } from "ee/entities/IDE/utils";
import { useActiveActionBaseId } from "ee/pages/Editor/Explorer/hooks";
import { useParentEntityInfo } from "ee/IDE/hooks/useParentEntityInfo";
import type { JSCollection } from "entities/JSCollection";
import { jsCollectionIdURL } from "ee/RouteBuilder";
import { JsFileIconV2 } from "pages/Editor/Explorer/ExplorerIcons";
import { getJSContextMenuByIdeType } from "ee/pages/Editor/IDE/EditorPane/JS/utils/getJSContextMenuByIdeType";
import type { EntityItem as EntityItemProps } from "ee/IDE/Interfaces/EntityItem";

export const JSEntityItem = ({ item }: { item: EntityItemProps }) => {
  const jsAction = useSelector((state: AppState) =>
    getJsCollectionByBaseId(state, item.key),
  ) as JSCollection;
  const location = useLocation();
  const ideType = getIDETypeByUrl(location.pathname);
  const activeActionBaseId = useActiveActionBaseId();
  const { parentEntityId } = useParentEntityInfo(ideType);

  const { editingEntity, enterEditMode, exitEditMode, updatingEntity } =
    useNameEditorState();

  const validateName = useValidateEntityName({
    entityName: item.title,
  });
  const dispatch = useDispatch();
  const contextMenu = getJSContextMenuByIdeType(ideType, jsAction);

  const jsActionPermissions = jsAction.userPermissions || [];

  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);

  const canManageJSAction = getHasManageActionPermission(
    isFeatureEnabled,
    jsActionPermissions,
  );

  const navigateToUrl = jsCollectionIdURL({
    baseParentEntityId: parentEntityId,
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
  }, [parentEntityId, jsAction.baseId, jsAction.name, location.pathname]);

  const nameEditorConfig = useMemo(() => {
    return {
      canEdit: canManageJSAction && !Boolean(jsAction.isMainJSCollection),
      isEditing: editingEntity === jsAction.id,
      isLoading: updatingEntity === jsAction.id,
      onEditComplete: exitEditMode,
      onNameSave: (newName: string) =>
        dispatch(saveJSObjectNameBasedOnIdeType(jsAction.id, newName, ideType)),
      validateName: (newName: string) => validateName(newName, item.title),
    };
  }, [
    canManageJSAction,
    editingEntity,
    exitEditMode,
    ideType,
    item.title,
    jsAction.id,
    jsAction.isMainJSCollection,
    dispatch,
    updatingEntity,
    validateName,
  ]);

  return (
    <EntityItem
      className="t--jsaction"
      id={jsAction.id}
      isSelected={activeActionBaseId === jsAction.id}
      key={jsAction.id}
      nameEditorConfig={nameEditorConfig}
      onClick={navigateToJSCollection}
      onDoubleClick={() => enterEditMode(jsAction.id)}
      rightControl={contextMenu}
      rightControlVisibility="hover"
      startIcon={JsFileIconV2(16, 16)}
      title={item.title}
    />
  );
};
