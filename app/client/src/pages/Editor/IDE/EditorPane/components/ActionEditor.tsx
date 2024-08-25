import { Flex } from "@appsmith/ads";
import React, { useCallback, useState } from "react";
import ActionToolbar from "./ActionToolbar";
import ActionDrawer from "./ActionDrawer";
import { useDispatch } from "react-redux";
import type { BottomTab } from "components/editorComponents/EntityBottomTabs";

interface Props {
  children: React.ReactNode;
  onRunClick: () => void;
  onDocsClick?: () => void;
  isRunning: boolean;
  tabs: BottomTab[];
  runOptionsSelector?: React.ReactNode;
  settingsRender: React.ReactNode;
  height?: number;
  onSetHeight?: (height: number) => void;
}

const ActionEditor = (props: Props) => {
  const dispatch = useDispatch();
  const setDrawerHeight = useCallback((height: number) => {
    if (props.onSetHeight) {
      dispatch(props.onSetHeight(height));
    }
  }, []);
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <Flex flex="1" flexDirection="column" overflow="hidden">
      <Flex flex="1" flexDirection="column" overflow="hidden">
        <Flex
          flex="1 1 0%"
          flexDirection="column"
          overflow="auto"
          padding="spaces-3"
        >
          {settingsOpen ? props.settingsRender : props.children}
        </Flex>
        <ActionToolbar
          onDocsClick={props.onDocsClick}
          onRunClick={props.onRunClick}
          onSettingsClick={() => setSettingsOpen(!settingsOpen)}
          runOptionSelector={props.runOptionsSelector}
        />
      </Flex>
      <ActionDrawer
        height={props.height}
        isRunning={props.isRunning}
        onResizeComplete={setDrawerHeight}
        tabs={props.tabs}
      />
    </Flex>
  );
};

export default ActionEditor;
