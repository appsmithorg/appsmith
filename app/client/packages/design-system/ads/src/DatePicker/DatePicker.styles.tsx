import styled from "styled-components";

export const StyledDatePickerHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  & > div {
    display: flex;
    align-items: center;
    gap: var(--ads-v2-spaces-2);
  }
`;

export const DatePickerFooter = styled.div`
  display: flex;
  justify-content: space-between;
`;

export const DatePickerShortcutContainer = styled.div`
  height: 100%;
  display: flex;
  flex-direction: row;
  gap: var(--ads-v2-spaces-3);
`;
export const DatePickerShortcut = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--ads-v2-spaces-1);
  align-items: end;
`;

export const DatePickerShortcutItem = styled.div`
  width: 120px;
  box-sizing: border-box;
  cursor: pointer;
  color: var(--ads-v2-color-fg);
  border-radius: var(--ads-v2-border-radius);
  padding: var(--ads-v2-spaces-3);
  font-size: 14px;

  &:hover:not([data-selected="true"]) {
    background-color: var(--ads-v2-color-bg-subtle);
  }

  &[data-selected="true"] {
    background-color: var(--ads-v2-color-bg-muted);
    color: var(--ads-v2-color-fg);
    font-weight: unset;
  }
`;
