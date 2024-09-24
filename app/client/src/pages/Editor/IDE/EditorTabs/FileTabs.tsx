import React from "react";

import {
  EditorEntityTabState,
  type EntityItem,
} from "ee/entities/IDE/constants";
import { useCurrentEditorState } from "../hooks";
import { FileTab } from "IDE/Components/FileTab";
import type { FocusEntityInfo } from "navigation/FocusEntity";

interface Props {
  tabs: EntityItem[];
  navigateToTab: (tab: EntityItem) => void;
  onClose: (actionId?: string) => void;
  currentEntity: FocusEntityInfo;
  isListActive?: boolean;
}

const FileTabs = (props: Props) => {
  const { currentEntity, isListActive, navigateToTab, onClose, tabs } = props;
  const { segmentMode } = useCurrentEditorState();

  const onCloseClick = (e: React.MouseEvent, id?: string) => {
    e.stopPropagation();
    onClose(id);
  };

  return (
    <>
      {tabs.map((tab: EntityItem) => (
        <FileTab
          icon={tab.icon}
          isActive={
            currentEntity.id === tab.key &&
            segmentMode !== EditorEntityTabState.Add &&
            !isListActive
          }
          key={tab.key}
          onClick={() => navigateToTab(tab)}
          onClose={(e) => onCloseClick(e, tab.key)}
          title={tab.title}
        />
      ))}
    </>
  );
};

export default FileTabs;
