import React, { useCallback, useMemo } from "react";
import { EntityListTree } from "@appsmith/ads";
import { useSelector } from "react-redux";
import {
  getEditingEntityName,
  selectWidgetsForCurrentPage,
} from "ee/selectors/entitiesSelector";
import { getSelectedWidgets } from "selectors/ui";
import { getPagePermissions } from "selectors/editorSelectors";
import { getUpdatingEntity } from "selectors/explorerSelector";
import { getHasManagePagePermission } from "ee/utils/BusinessFeatures/permissionPageHelpers";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { useValidateEntityName } from "IDE/Components/EditableName/useValidateEntityName";

import type { UIEntityListTreeProps } from "./UIEntityListTree.types";
import { useWidgetTreeState } from "./hooks/useWidgetTreeState";
import { useWidgetNameEditor } from "./hooks/useWidgetNameEditor";
import { useWidgetTreeHandlers } from "./hooks/useWidgetTreeHandlers";
import { enhanceWidgetTree } from "./utils/treeEnhancer";
import type { WidgetType } from "constants/WidgetConstants";
import { WidgetTypeIcon } from "pages/Editor/IDE/EditorPane/UI/UIEntityListTree/WidgetTypeIcon";
import { WidgetContextMenu } from "pages/Editor/IDE/EditorPane/UI/UIEntityListTree/WidgetContextMenu";
import { useSwitchToWidget } from "pages/Editor/IDE/EditorPane/UI/UIEntityListTree/hooks";

export const UIEntityListTree: React.FC<UIEntityListTreeProps> = ({ className }) => {
  const widgets = useSelector(selectWidgetsForCurrentPage);
  const selectedWidgets = useSelector(getSelectedWidgets);
  const updatingEntity = useSelector(getUpdatingEntity);
  const editingEntity = useSelector(getEditingEntityName);

  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);
  const pagePermissions = useSelector(getPagePermissions);
  const canManagePages = getHasManagePagePermission(
    isFeatureEnabled,
    pagePermissions,
  );

  const { expandedWidgets, handleExpand } = useWidgetTreeState();
  const switchToWidget = useSwitchToWidget();
  const validateName = useValidateEntityName({ entityName: "" });

  const treeItems = useMemo(() => {
    if (!widgets?.children) return [];

    return enhanceWidgetTree(widgets.children, {
      selectedIds: selectedWidgets,
      expandedIds: expandedWidgets,
      getIcon: (type: string) => <WidgetTypeIcon type={type as WidgetType} />,
    });
  }, [widgets?.children, selectedWidgets, expandedWidgets]);

  const handleNameEditor = useCallback(
    (widgetId: string) => {
      const editor = useWidgetNameEditor(widgetId);
      return {
        canEdit: canManagePages,
        isLoading: updatingEntity === widgetId,
        isEditing: editingEntity === widgetId,
        onNameSave: editor.handleNameSave,
        onEditComplete: editor.exitEditMode,
        validateName,
      };
    },
    [canManagePages, updatingEntity, editingEntity, validateName],
  );

  const { handleClick, handleDoubleClick } = useWidgetTreeHandlers({
    switchToWidget,
    enterEditMode: useWidgetNameEditor("").enterEditMode,
  });

  const enhancedItems = useMemo(() => {
    return treeItems.map((item) => ({
      ...item,
      onClick: (e: React.MouseEvent) =>
        handleClick(e, item.id),
      onDoubleClick: () => handleDoubleClick(item.id),
      rightControl: (
        <WidgetContextMenu
          canManagePages={canManagePages}
          widgetId={item.id}
        />
      ),
      rightControlVisibility: "hover" as const,
      nameEditorConfig: handleNameEditor(item.id),
    }));
  }, [treeItems, handleClick, handleDoubleClick, canManagePages, handleNameEditor]);

  return (
    <EntityListTree
      className={className}
      items={enhancedItems}
      onItemExpand={handleExpand}
    />
  );
};
