import React from "react";
import SidebarButton from "./SidebarButton";
import type { SidebarButtonProps } from "./SidebarButton/SidebarButton";
import * as Styled from "./styles";

// Sidebar handles the correct handling of sidebar button. It will check if
// the button should be selected and only handle calling the onClick
export interface IDESidebarButton
  extends Omit<SidebarButtonProps, "onClick" | "selected"> {
  state: string;
  urlSuffix: string;
}

export interface IDESidebarProps {
  id?: string;
  topButtons: IDESidebarButton[];
  bottomButtons: IDESidebarButton[];
  editorState: string;
  onClick: (suffix: string) => void;
}

export function IDESidebar(props: IDESidebarProps) {
  const { bottomButtons, editorState, onClick, topButtons } = props;

  return (
    <Styled.Container className="t--sidebar" id={props.id}>
      <div>
        {topButtons.map((button) => (
          <SidebarButton
            condition={button.condition}
            icon={button.icon}
            key={button.state}
            onClick={onClick}
            selected={editorState === button.state}
            testId={button.testId}
            title={button.title}
            tooltip={button.tooltip}
            urlSuffix={button.urlSuffix}
          />
        ))}
      </div>
      <div>
        {bottomButtons.map((button) => (
          <SidebarButton
            condition={button.condition}
            icon={button.icon}
            key={button.state}
            onClick={onClick}
            selected={editorState === button.state}
            testId={button.testId}
            title={button.title}
            tooltip={button.tooltip}
            urlSuffix={button.urlSuffix}
          />
        ))}
      </div>
    </Styled.Container>
  );
}
