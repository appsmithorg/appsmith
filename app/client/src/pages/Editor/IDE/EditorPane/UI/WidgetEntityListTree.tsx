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
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { builderURL } from "ee/RouteBuilder";
import { useNavigateToWidget } from "pages/Editor/Explorer/Widgets/useNavigateToWidget";
import {
  getCurrentBasePageId,
  getPagePermissions,
} from "selectors/editorSelectors";
import { NavigationMethod } from "utils/history";
import { getUpdatingEntity } from "selectors/explorerSelector";
import { getHasManagePagePermission } from "ee/utils/BusinessFeatures/permissionPageHelpers";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { updateWidgetName } from "actions/propertyPaneActions";
import { initExplorerEntityNameEdit } from "actions/explorerActions";
import { useValidateEntityName } from "IDE/Components/EditableName/useValidateEntityName";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import WidgetFactory from "WidgetProvider/factory";
import WidgetIcon from "pages/Editor/Explorer/Widgets/WidgetIcon";
import { EntityClassNames } from "pages/Editor/Explorer/Entity";
import WidgetContextMenu from "pages/Editor/Explorer/Widgets/WidgetContextMenu";
import { convertToPageIdSelector } from "selectors/pageListSelectors";

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

export const WidgetEntityListTree = () => {
  const widgets = useSelector(selectWidgetsForCurrentPage);
  const selectedWidgets = useSelector(getSelectedWidgets);
  const widgetsToExpand = useSelector(getEntityExplorerWidgetsToExpand);
  const basePageId = useSelector(getCurrentBasePageId) as string;
  const pageId = useSelector((state) =>
    convertToPageIdSelector(state, basePageId),
  );
  const [expandedWidgets, setExpandedWidgets] =
    useState<string[]>(widgetsToExpand);

  const { navigateToWidget } = useNavigateToWidget();

  const switchWidget = useCallback(
    (e: React.MouseEvent, widget: CanvasStructure) => {
      const isMultiSelect = e.metaKey || e.ctrlKey;
      const isShiftSelect = e.shiftKey;

      AnalyticsUtil.logEvent("ENTITY_EXPLORER_CLICK", {
        type: "WIDGETS",
        fromUrl: location.pathname,
        toUrl: `${builderURL({
          basePageId,
          hash: widget.widgetId,
        })}`,
        name: widget.widgetName,
      });
      navigateToWidget(
        widget.widgetId,
        widget.type,
        basePageId,
        NavigationMethod.EntityExplorer,
        selectedWidgets.includes(widget.widgetId),
        isMultiSelect,
        isShiftSelect,
      );
    },
    [basePageId, navigateToWidget, selectedWidgets],
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

  const validateName = useValidateEntityName({
    entityName: "",
  });

  const items = enhanceItemsTree(widgets?.children || [], (widget) => ({
    isExpanded: expandedWidgets.includes(widget.widgetId),
    startIcon: WidgetFactory.getWidgetMethods(widget.type).IconCmp || (
      <WidgetIcon type={widget.type} />
    ),
    id: widget.widgetId,
    isSelected: selectedWidgets.includes(widget.widgetId),
    title: widget.widgetName,
    onClick: (e) => switchWidget(e, widget),
    onDoubleClick: () => enterEditMode(widget.widgetId),
    rightControl: (
      <WidgetContextMenu
        canManagePages={canManagePages}
        className={EntityClassNames.CONTEXT_MENU}
        pageId={pageId ?? ""}
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
      validateName,
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
