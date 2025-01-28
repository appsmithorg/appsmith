import React from "react";
import { SidebarButton } from "./SidebarButton";
import * as Styled from "./styles";
import type { IDESidebarProps } from "./types";

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
