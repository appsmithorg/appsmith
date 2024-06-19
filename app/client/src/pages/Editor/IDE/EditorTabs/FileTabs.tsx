import React, { useEffect } from "react";

import type { EntityItem } from "@appsmith/entities/IDE/constants";
import { useCurrentEditorState } from "../hooks";
import { FileTab } from "IDE/Components/FileTab";

interface Props {
  tabs: EntityItem[];
  navigateToTab: (tab: EntityItem) => void;
  onClose: (actionId?: string) => void;
  currentTab: string;
}

const FileTabs = (props: Props) => {
  const { currentTab, navigateToTab, onClose, tabs } = props;
  const { segmentMode } = useCurrentEditorState();

  useEffect(() => {
    const activetab = document.querySelector(".editor-tab.active");
    if (activetab) {
      activetab.scrollIntoView({
        inline: "nearest",
      });
    }
  }, [tabs, segmentMode]);

  const onCloseClick = (e: React.MouseEvent, id?: string) => {
    e.stopPropagation();
    onClose(id);
  };

  return (
    <>
      {tabs.map((tab: EntityItem) => (
        <FileTab
          icon={tab.icon}
          isActive={currentTab === tab.key}
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
