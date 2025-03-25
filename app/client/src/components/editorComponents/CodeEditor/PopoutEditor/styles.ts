import styled from "styled-components";

export const Backdrop = styled.div`
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
`;

export const PopoutContainer = styled.div`
  background: var(--ads-v2-color-bg);
  border: 1px solid var(--ads-v2-color-border);
  border-radius: var(--ads-v2-border-radius);
  box-shadow: var(--ads-v2-shadow-popovers);
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  overflow: hidden;
  position: relative;
  pointer-events: auto;
`;

export const Header = styled.div`
  padding: var(--ads-v2-spaces-3);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--ads-v2-color-bg);
  border-bottom: 1px solid var(--ads-v2-color-border);
  cursor: move;
  user-select: none;
`;

export const EditorContainer = styled.div`
  flex: 1;
  overflow-y: hidden;
  white-space: nowrap;

  /* If you need to preserve whitespace and prevent wrapping */
  & .CodeMirror {
    white-space: pre;
  }
`;
