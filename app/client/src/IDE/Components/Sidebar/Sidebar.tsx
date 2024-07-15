import React from "react";
import styled from "styled-components";
import SidebarButton from "./SidebarButton";
import type { EditorState } from "@appsmith/entities/IDE/constants";
import type { SidebarButtonProps } from "./SidebarButton/SidebarButton";
import { Flex } from "design-system";

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
  onClick: (suffix: string, state: EditorState) => void;
}

function IDESidebar({
  bottomButtons,
  editorState,
  onClick,
  topButtons,
  id,
}: IDESidebarProps) {
  return (
    <Container className="t--sidebar" id={id}>
      <div>
        {topButtons.map(({ state, icon, urlSuffix, title, tooltip }) => (
          <SidebarButton
            icon={icon}
            key={state}
            onClick={() => onClick(urlSuffix, state)}
            selected={editorState === state}
            title={title}
            tooltip={tooltip}
            urlSuffix={urlSuffix}
          />
        ))}
      </div>
      <div>
        {bottomButtons.map(({ state, icon, urlSuffix, title, tooltip }) => (
          <SidebarButton
            icon={icon}
            key={state}
            onClick={() => onClick(urlSuffix, state)}
            selected={editorState === state}
            title={title}
            tooltip={tooltip}
            urlSuffix={urlSuffix}
          />
        ))}
      </div>
    </Container>
  );
}

export default IDESidebar;
