import React, { useCallback, useMemo } from "react";
import { type EntityListTreeItem, EntityItem } from "@appsmith/ads";
import { WidgetContextMenu } from "./WidgetContextMenu";
import { useDispatch, useSelector } from "react-redux";
import { getWidgetByID } from "sagas/selectors";
import { updateWidgetName } from "actions/propertyPaneActions";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { getHasManagePagePermission } from "ee/utils/BusinessFeatures/permissionPageHelpers";
import { useValidateEntityName } from "IDE";
import { useNameEditorState } from "IDE/hooks/useNameEditorState";
import { getPagePermissions } from "selectors/editorSelectors";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { useSwitchToWidget } from "./hooks/useSwitchToWidget";
import { WidgetTypeIcon } from "./WidgetTypeIcon";
import type { WidgetProps } from "widgets/BaseWidget";

export const WidgetTreeItem = ({ item }: { item: EntityListTreeItem }) => {
  const widget: WidgetProps | undefined = useSelector(getWidgetByID(item.id));
  const switchToWidget = useSwitchToWidget();

  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);
  const pagePermissions = useSelector(getPagePermissions);
  const canManagePages = getHasManagePagePermission(
    isFeatureEnabled,
    pagePermissions,
  );
  const dispatch = useDispatch();

  const handleNameSave = useCallback(
    (id: string, newName: string) => {
      dispatch(updateWidgetName(id, newName));
    },
    [dispatch],
  );

  const { editingEntity, enterEditMode, exitEditMode, updatingEntity } =
    useNameEditorState();

  const validateName = useValidateEntityName({
    entityName: item.name,
    entityId: item.id,
  });

  const isLoading = updatingEntity === item.id;
  const isEditing = editingEntity === item.id;
  const onNameSave = useCallback(
    (newName: string) => handleNameSave(item.id, newName),
    [handleNameSave, item.id],
  );

  const nameEditorConfig = useMemo(
    () => ({
      canEdit: canManagePages,
      isLoading,
      isEditing,
      onNameSave,
      onEditComplete: exitEditMode,
      validateName,
    }),
    [
      canManagePages,
      exitEditMode,
      isEditing,
      isLoading,
      onNameSave,
      validateName,
    ],
  );

  const startIcon = useMemo(
    () => <WidgetTypeIcon type={widget?.type} />,
    [widget?.type],
  );

  const onClick = useCallback(
    (e: React.MouseEvent) => switchToWidget(e, widget),
    [switchToWidget, widget],
  );

  const onDoubleClick = useCallback(
    () => enterEditMode(item.id),
    [enterEditMode, item.id],
  );

  const rightControl = useMemo(
    () => (
      <WidgetContextMenu canManagePages={canManagePages} widgetId={item.id} />
    ),
    [canManagePages, item.id],
  );

  return (
    <EntityItem
      id={item.id}
      isSelected={item.isSelected}
      nameEditorConfig={nameEditorConfig}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      rightControl={rightControl}
      rightControlVisibility="hover"
      startIcon={startIcon}
      title={item.name}
    />
  );
};
