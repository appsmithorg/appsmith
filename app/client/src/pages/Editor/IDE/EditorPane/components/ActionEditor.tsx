import { Flex } from "design-system";
import React, { useCallback } from "react";
import ActionToolbar from "./ActionToolbar";
import { noop } from "lodash";
import ActionDrawer from "./ActionDrawer";
import { setResponsePaneHeight } from "actions/debuggerActions";
import { useDispatch } from "react-redux";
import type { BottomTab } from "components/editorComponents/EntityBottomTabs";

interface Props {
  children: React.ReactNode;
  onRunClick: () => void;
  onDocsClick?: () => void;
  isRunning: boolean;
  tabs: BottomTab[];
  runOptionsSelector?: React.ReactNode;
}

const ActionEditor = (props: Props) => {
  const dispatch = useDispatch();
  const setDrawerHeight = useCallback((height: number) => {
    dispatch(setResponsePaneHeight(height));
  }, []);

  return (
    <Flex flex="1" flexDirection="column" overflow="hidden">
      <Flex flex="1" flexDirection="column" overflow="hidden">
        <Flex
          flex="1 1 0%"
          flexDirection="column"
          overflow="auto"
          padding="spaces-3"
        >
          {props.children}
        </Flex>
        <ActionToolbar
          onDocsClick={props.onDocsClick}
          onRunClick={props.onRunClick}
          onSettingsClick={noop}
          runOptionSelector={props.runOptionsSelector}
        />
      </Flex>
      <ActionDrawer
        isRunning={props.isRunning}
        onResizeComplete={setDrawerHeight}
        tabs={props.tabs}
      />
    </Flex>
  );
};

export default ActionEditor;
