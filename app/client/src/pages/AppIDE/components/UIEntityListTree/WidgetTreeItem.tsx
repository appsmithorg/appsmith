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

export const WidgetTreeItem = ({ item }: { item: EntityListTreeItem }) => {
  const widget = useSelector(getWidgetByID(item.id));
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
    entityName: widget.widgetName,
    entityId: widget.widgetId,
  });

  const isLoading = updatingEntity === widget.widgetId;
  const isEditing = editingEntity === widget.widgetId;
  const onNameSave = useCallback(
    (newName: string) => handleNameSave(widget.widgetId, newName),
    [handleNameSave, widget.widgetId],
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
    () => <WidgetTypeIcon type={widget.type} />,
    [widget.type],
  );

  const onClick = useCallback(
    (e: React.MouseEvent) => switchToWidget(e, widget),
    [switchToWidget, widget],
  );

  const onDoubleClick = useCallback(
    () => enterEditMode(widget.widgetId),
    [enterEditMode, widget.widgetId],
  );

  const rightControl = useMemo(
    () => (
      <WidgetContextMenu
        canManagePages={canManagePages}
        widgetId={widget.widgetId}
      />
    ),
    [canManagePages, widget.widgetId],
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
      title={widget.widgetName}
    />
  );
};
