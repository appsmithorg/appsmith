import styled from "styled-components";
import { Layers } from "constants/Layers";
import { BOTTOM_BAR_HEIGHT } from "./constants";

export const Container = styled.div`
  width: 100%;
  height: ${BOTTOM_BAR_HEIGHT}px;
  display: flex;
  position: fixed;
  justify-content: space-between;
  background-color: ${(props) => props.theme.colors.editorBottomBar.background};
  z-index: ${Layers.bottomBar};
  border-top: solid 1px var(--ads-v2-color-border);
`;

export const Wrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;
