import React, { useCallback } from "react";
import { EntityListTree } from "@appsmith/ads";
import { useDispatch, useSelector } from "react-redux";
import { selectWidgetsForCurrentPage } from "ee/selectors/entitiesSelector";
import { getSelectedWidgets } from "selectors/ui";
import { getPagePermissions } from "selectors/editorSelectors";
import { getHasManagePagePermission } from "ee/utils/BusinessFeatures/permissionPageHelpers";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { useValidateEntityName } from "IDE";
import { updateWidgetName } from "actions/propertyPaneActions";
import { WidgetContextMenu } from "./WidgetContextMenu";
import { useSwitchToWidget } from "./hooks/useSwitchToWidget";
import { WidgetTypeIcon } from "./WidgetTypeIcon";
import { useWidgetTreeState } from "./hooks/useWidgetTreeExpandedState";
import { enhanceItemsTree } from "./utils/enhanceTree";
import { useNameEditorState } from "IDE/hooks/useNameEditorState";

export const UIEntityListTree = () => {
  const widgets = useSelector(selectWidgetsForCurrentPage);
  const selectedWidgets = useSelector(getSelectedWidgets);

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

  const validateName = useValidateEntityName({});

  const { expandedWidgets, handleExpand } = useWidgetTreeState();

  const items = enhanceItemsTree(widgets?.children || [], (widget) => ({
    id: widget.widgetId,
    title: widget.widgetName,
    startIcon: <WidgetTypeIcon type={widget.type} />,
    isSelected: selectedWidgets.includes(widget.widgetId),
    isExpanded: expandedWidgets.includes(widget.widgetId),
    onClick: (e) => switchToWidget(e, widget),
    onDoubleClick: () => enterEditMode(widget.widgetId),
    rightControl: (
      <WidgetContextMenu
        canManagePages={canManagePages}
        widgetId={widget.widgetId}
      />
    ),
    rightControlVisibility: "hover",
    nameEditorConfig: {
      canEdit: canManagePages,
      isLoading: updatingEntity === widget.widgetId,
      isEditing: editingEntity === widget.widgetId,
      onNameSave: (newName) => handleNameSave(widget.widgetId, newName),
      onEditComplete: exitEditMode,
      validateName: (newName) => validateName(newName, widget.widgetName),
    },
  }));

  return <EntityListTree items={items} onItemExpand={handleExpand} />;
};
