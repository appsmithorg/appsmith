import React, { useCallback } from "react";
import styled from "styled-components";
import SidebarButton from "./SidebarButton";
import type { EditorState } from "@appsmith/entities/IDE/constants";
import type { ISidebarButton } from "../../Interfaces/ISidebarButton";

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

interface IDESidebarProps {
  id?: string;
  topButtons: ISidebarButton[];
  bottomButtons: ISidebarButton[];
  appState: EditorState;
  onClick: (suffix: string) => void;
}

function IDESidebar(props: IDESidebarProps) {
  const { appState, bottomButtons, onClick, topButtons } = props;

  const handleOnClick = useCallback(
    (button: ISidebarButton) => {
      if (appState !== button.state) {
        onClick(button.urlSuffix);
      }
    },
    [appState],
  );

  return (
    <Container className="t--sidebar" id={props.id}>
      <div>
        {topButtons.map((b) => (
          <SidebarButton
            icon={b.icon}
            key={b.state}
            onClick={() => {
              handleOnClick(b);
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
              handleOnClick(b);
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

export default IDESidebar;
