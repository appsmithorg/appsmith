import React from "react";
import styled from "styled-components";
import type { Condition } from "./SidebarButton";
import SidebarButton from "./SidebarButton";
import type { EditorState } from "@appsmith/entities/IDE/constants";

const Container = styled.div`
  width: 50px;
  border-right: 1px solid var(--ads-v2-color-border);
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background-color: var(--ads-v2-color-bg);
  position: relative;
`;

export interface ISidebarButton {
  state: EditorState;
  icon: string;
  title?: string;
  urlSuffix: string;
  condition?: Condition;
  tooltip?: string;
}

interface SidebarComponentProps {
  topButtons: ISidebarButton[];
  bottomButtons: ISidebarButton[];
  appState: EditorState;
  onClick: (suffix: string) => void;
}

function SidebarComponent(props: SidebarComponentProps) {
  const { appState, bottomButtons, onClick, topButtons } = props;

  return (
    <Container className="t--sidebar" id="t--app-sidebar">
      <div>
        {topButtons.map((b) => (
          <SidebarButton
            icon={b.icon}
            key={b.state}
            onClick={() => {
              if (appState !== b.state) {
                onClick(b.urlSuffix);
              }
            }}
            selected={appState === b.state}
            title={b.title}
            tooltip={b.tooltip}
          />
        ))}
      </div>
      <div>
        {bottomButtons.map((b) => (
          <SidebarButton
            icon={b.icon}
            key={b.state}
            onClick={() => {
              if (appState !== b.state) {
                onClick(b.urlSuffix);
              }
            }}
            selected={appState === b.state}
            title={b.title}
            tooltip={b.tooltip}
          />
        ))}
      </div>
    </Container>
  );
}

export default SidebarComponent;
