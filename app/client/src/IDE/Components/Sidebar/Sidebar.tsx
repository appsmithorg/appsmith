import React from "react";
import styled from "styled-components";
import SidebarButton from "./SidebarButton";
import type { EditorState } from "ee/entities/IDE/constants";
import type { SidebarButtonProps } from "./SidebarButton/SidebarButton";
import { Flex } from "@appsmith/ads";

const Container = styled(Flex)`
  width: 50px;
  border-right: 1px solid var(--ads-v2-color-border);
  height: 100%;
  flex-direction: column;
  justify-content: space-between;
  background-color: var(--ads-v2-color-bg);
  position: relative;
`;

// Sidebar handles the correct handling of sidebar button. It will check if
// the button should be selected and only handle calling the onClick
export interface IDESidebarButton
  extends Omit<SidebarButtonProps, "onClick" | "selected"> {
  state: EditorState;
  urlSuffix: string;
}

interface IDESidebarProps {
  id?: string;
  topButtons: IDESidebarButton[];
  bottomButtons: IDESidebarButton[];
  editorState: EditorState;
  onClick: (suffix: string) => void;
}

function IDESidebar(props: IDESidebarProps) {
  const { bottomButtons, editorState, onClick, topButtons } = props;

  return (
    <Container className="t--sidebar" id={props.id}>
      <div>
        {topButtons.map((button) => (
          <SidebarButton
            icon={button.icon}
            key={button.state}
            onClick={onClick}
            selected={editorState === button.state}
            title={button.title}
            tooltip={button.tooltip}
            urlSuffix={button.urlSuffix}
          />
        ))}
      </div>
      <div>
        {bottomButtons.map((button) => (
          <SidebarButton
            icon={button.icon}
            key={button.state}
            onClick={onClick}
            selected={editorState === button.state}
            title={button.title}
            tooltip={button.tooltip}
            urlSuffix={button.urlSuffix}
          />
        ))}
      </div>
    </Container>
  );
}

export default IDESidebar;
