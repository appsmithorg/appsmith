import styled, { css } from "styled-components";
import { Intent, IntentColors } from "constants/DefaultTheme";

export const DropdownTrigger = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  & > div > div {
    margin-right: 20px;
  }
  &&& button {
    width: 100%;
    color: inherit;
    justify-content: space-between;
    outline: 0;
    span {
      color: inherit;
    }
    &:hover {
      background: inherit;
    }
  }
`;
export const DropdownContent = styled.div`
  &&& * {
    font-size: ${props => props.theme.fontSizes[4]}px;
  }
`;

export const DropdownContentSection = styled.div<{ stick: boolean }>`
  position: ${props => (props.stick ? "sticky" : "relative")};
  background: white;
  z-index: ${props => (props.stick ? 1 : 0)};
  padding: 8px 0;
  &&&&&& button {
    padding: 0;
    min-height: 0px;
  }
  &:first-of-type {
    padding: 0 0 0px 0;
  }
  &:last-of-type {
    padding: 0px 0 0 0;
  }
  &:not(:last-of-type):after {
    position: absolute;
    content: "";
    left: 0;
    right: 0;
    bottom: 0;
    height: 1px;
    background: #ccc;
  }
`;

export const onHover = css<{ intent?: Intent }>`
  cursor: pointer;
  &&&&:hover {
    & * {
      color: ${props => props.theme.colors.textOnDarkBG};
      text-decoration: none;
    }
    & a:hover {
      text-decoration: none;
    }
    background: ${props =>
      props.intent ? IntentColors[props.intent] : IntentColors.primary};
    color: ${props => props.theme.colors.textOnDarkBG};
  }
`;

export const Option = styled.div<{ intent?: Intent; active?: boolean }>`
  padding: 8px 16px;
  margin: 4px 0;

  & a {
    color: ${props => props.theme.colors.textDefault};
    text-decoration: none;
  }
  &:first-of-type,
  &:last-of-type {
    margin: 0;
  }
  ${props => (props.active ? onHover : ``)};
`;
