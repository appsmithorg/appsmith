import React, { useCallback, useState } from "react";
import { EntityListTree, type EntityListTreeItem } from "@appsmith/ads";
import { useDispatch, useSelector } from "react-redux";
import {
  getEditingEntityName,
  selectWidgetsForCurrentPage,
} from "ee/selectors/entitiesSelector";
import type { CanvasStructure } from "reducers/uiReducers/pageCanvasStructureReducer";
import { getSelectedWidgets } from "selectors/ui";
import { getEntityExplorerWidgetsToExpand } from "selectors/widgetSelectors";
import { getPagePermissions } from "selectors/editorSelectors";
import { getUpdatingEntity } from "selectors/explorerSelector";
import { getHasManagePagePermission } from "ee/utils/BusinessFeatures/permissionPageHelpers";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { updateWidgetName } from "actions/propertyPaneActions";
import { initExplorerEntityNameEdit } from "actions/explorerActions";
import { useValidateEntityName } from "IDE/Components/EditableName/useValidateEntityName";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { WidgetContextMenu } from "./WidgetContextMenu";
import { useSwitchToWidget } from "./hooks/useSwitchToWidget";
import { WidgetTypeIcon } from "./WidgetTypeIcon";

const enhanceItemsTree = (
  items: CanvasStructure[],
  enhancer: (item: CanvasStructure) => EntityListTreeItem,
) => {
  return items.map((child): EntityListTreeItem => {
    return {
      ...enhancer(child),
      children: child.children
        ? enhanceItemsTree(child.children, enhancer)
        : undefined,
    };
  });
};

export const UIEntityListTree = () => {
  const widgets = useSelector(selectWidgetsForCurrentPage);
  const selectedWidgets = useSelector(getSelectedWidgets);
  const widgetsToExpand = useSelector(getEntityExplorerWidgetsToExpand);
  const [expandedWidgets, setExpandedWidgets] =
    useState<string[]>(widgetsToExpand);

  const switchToWidget = useSwitchToWidget();

  const handleOnClick = useCallback(
    (e, widget) => switchToWidget(e, widget),
    [switchToWidget],
  );

  const updatingEntity = useSelector(getUpdatingEntity);
  const editingEntity = useSelector(getEditingEntityName);

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

  const enterEditMode = useCallback(
    (id: string) => {
      dispatch(initExplorerEntityNameEdit(id));
    },
    [dispatch],
  );

  const exitEditMode = useCallback(() => {
    dispatch({
      type: ReduxActionTypes.END_EXPLORER_ENTITY_NAME_EDIT,
    });
  }, [dispatch]);

  const validateName = useValidateEntityName({});

  const items = enhanceItemsTree(widgets?.children || [], (widget) => ({
    id: widget.widgetId,
    title: widget.widgetName,
    startIcon: WidgetTypeIcon(widget.type),
    isSelected: selectedWidgets.includes(widget.widgetId),
    isExpanded: expandedWidgets.includes(widget.widgetId),
    onClick: (e) => handleOnClick(e, widget),
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

  const handleWidgetExpand = useCallback(
    (id: string) => {
      if (expandedWidgets.includes(id)) {
        setExpandedWidgets(
          [...expandedWidgets].filter((widgetId) => widgetId !== id),
        );
      } else {
        setExpandedWidgets([...expandedWidgets, id]);
      }
    },
    [expandedWidgets],
  );

  return <EntityListTree items={items} onItemExpand={handleWidgetExpand} />;
};
