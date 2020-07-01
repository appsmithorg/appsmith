import styled, { css } from "styled-components";
import { Intent, Skin } from "constants/DefaultTheme";

export const DropdownTrigger = styled.div<{ skin: Skin }>`
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
    min-width: 20px;
    span {
      font-weight: 400;
      color: ${props =>
        props.skin === Skin.DARK
          ? props.theme.colors.textOnDarkBG
          : props.skin === Skin.LIGHT
          ? props.theme.colors.defaultText
          : "initial"};
    }
    &:hover {
      background: inherit;
    }
  }
`;
export const DropdownContent = styled.div<{ skin: Skin }>`
  &&& * {
    font-size: ${props => props.theme.fontSizes[3]}px;
  }
  border: ${props => (props.skin === Skin.DARK ? "1px solid" : "")};
  border-color: ${props =>
    props.skin === Skin.DARK ? props.theme.dropdown[props.skin].border : ""};
  background: ${props => props.theme.dropdown[props.skin].inActiveBG};
`;

export const DropdownContentSection = styled.div<{
  stick: boolean;
  skin: Skin;
}>`
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
    background: ${props => (props.skin === Skin.DARK ? "#535B62" : "#ccc")};
  }
`;

export const highlightOption = css<{ intent?: Intent; skin: Skin }>`
  text-decoration: none;
  color: ${props => props.theme.dropdown[props.skin].hoverText};
  background: ${props => props.theme.dropdown[props.skin].hoverBG};
  * {
    color: ${props => props.theme.dropdown[props.skin].hoverText};
  }
`;

export const Option = styled.div<{
  intent?: Intent;
  active?: boolean;
  disabled?: boolean;
  skin: Skin;
}>`
  padding: 8px 16px;
  min-width: 200px;

  &:first-of-type,
  &:last-of-type {
    margin: 0;
  }
  cursor: pointer;
  background: ${props => props.theme.dropdown[props.skin].inActiveBG};
  color: ${props => props.theme.dropdown[props.skin].inActiveText};
  &:hover {
    ${props => (!props.disabled ? highlightOption : ``)};
  }
  ${props => (props.active && !props.disabled ? highlightOption : ``)};
  &&& button {
    span {
      color: ${props =>
        props.skin === Skin.DARK
          ? props.theme.colors.textOnDarkBG
          : props.skin === Skin.LIGHT
          ? props.theme.colors.defaultText
          : "initial"};
    }
  }
`;
