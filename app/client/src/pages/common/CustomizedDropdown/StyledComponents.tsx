import styled, { css } from "styled-components";
import { Intent, IntentColors } from "constants/DefaultTheme";

export const DropdownTrigger = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  & > div > div,
  & > div > span {
    margin-right: 20px;
  }
  &&& button {
    width: 100%;
    color: inherit;
    justify-content: space-between;
    outline: 0;
    span {
      color: inherit;
      font-weight: 400;
    }
    &:hover {
      background: inherit;
    }
  }
`;
export const DropdownContent = styled.div<{ themeType: string }>`
  &&& * {
    font-size: ${props => props.theme.fontSizes[3]}px;
  }
  border: ${props => (props.themeType === "dark" ? "1px solid" : "")};
  border-color: ${props =>
    props.themeType === "dark"
      ? props.theme.dropdown[props.themeType].border
      : ""};
  background: ${props => props.theme.dropdown[props.themeType].inActiveBG};
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

export const highlightOption = css<{ intent?: Intent; themeType: string }>`
  text-decoration: none;
  color: ${props => props.theme.dropdown[props.themeType].hoverText};
  background: ${props => props.theme.dropdown[props.themeType].hoverBG};
  * {
    color: ${props => props.theme.dropdown[props.themeType].hoverText};
  }
`;

export const Option = styled.div<{
  intent?: Intent;
  active?: boolean;
  disabled?: boolean;
  themeType: string;
}>`
  padding: 8px 16px;
  min-width: 200px;

  &:first-of-type,
  &:last-of-type {
    margin: 0;
  }
  cursor: pointer;
  background: ${props => props.theme.dropdown[props.themeType].inActiveBG};
  color: ${props => props.theme.dropdown[props.themeType].inActiveText};
  &:hover {
    ${props => (!props.disabled ? highlightOption : ``)};
  }
  ${props => (props.active && !props.disabled ? highlightOption : ``)};
`;
