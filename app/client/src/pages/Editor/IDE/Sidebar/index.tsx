import React, { useCallback } from "react";
import { getIsAppSidebarEnabled } from "selectors/ideSelectors";
import { useSelector } from "react-redux";
import styled from "styled-components";
import SidebarButton from "./SidebarButton";
import { builderURL } from "@appsmith/RouteBuilder";
import { getCurrentPageId } from "selectors/editorSelectors";
import history from "utils/history";
import { ButtonButtons, TopButtons } from "entities/IDE/constants";
import useCurrentAppState from "../hooks";

const Container = styled.div`
  width: 50px;
  border-right: 1px solid var(--ads-v2-color-border);
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background-color: var(--ads-v2-color-bg);
`;

function Sidebar() {
  const appState = useCurrentAppState();
  const isAppSidebarEnabled = useSelector(getIsAppSidebarEnabled);
  const pageId = useSelector(getCurrentPageId);
  const onClick = useCallback(
    (suffix) => {
      history.push(
        builderURL({
          pageId,
          suffix,
        }),
      );
    },
    [pageId],
  );
  if (!isAppSidebarEnabled) {
    return null;
  }

  return (
    <Container>
      <div>
        {TopButtons.map((b) => (
          <SidebarButton
            icon={b.icon}
            key={b.state}
            onClick={() => onClick(b.urlSuffix)}
            selected={appState === b.state}
            title={b.title}
          />
        ))}
      </div>
      <div>
        {ButtonButtons.map((b) => (
          <SidebarButton
            icon={b.icon}
            key={b.state}
            onClick={() => onClick(b.urlSuffix)}
            selected={appState === b.state}
            tooltip={b.title}
          />
        ))}
      </div>
    </Container>
  );
}

export default Sidebar;
