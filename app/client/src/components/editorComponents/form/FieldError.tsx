import React from "react";
import styled from "styled-components";
import { IntentColors } from "constants/DefaultTheme";
// Note: This component is only for the input fields which donot have the
// popover error tooltip. This is also only for Appsmith components
// Not to be used in widgets / canvas

const StyledError = styled.span<{ show: boolean }>`
  text-align: left;
  color: ${IntentColors.danger};
  font-size: ${props => props.theme.fontSizes[2]}px;
  opacity: ${props => (props.show ? 1 : 0)};
  padding-left: ${props => props.theme.fontSizes[3]}px;
  position: relative;
  margin-top: ${props => props.theme.spaces[1]}px;
  &:before {
    position: absolute;
    content: "!";
    color: white;
    background: ${IntentColors.danger};
    height: ${props => props.theme.fontSizes[2]}px;
    width: ${props => props.theme.fontSizes[2]}px;
    border-radius: 50%;
    position: absolute;
    content: "!";
    color: white;
    border-radius: 50%;
    left: 0;
    top: 2px;
    display: flex;
    font-weight: ${props => props.theme.fontWeights[2]};
    font-size: ${props => props.theme.fontSizes[1]}px;
    justify-content: center;
    align-items: center;
  }
`;

type FormFieldErrorProps = {
  error?: string;
};

export const FormFieldError = (props: FormFieldErrorProps) => {
  return <StyledError show={!!props.error}>{props.error}</StyledError>;
};

export default FormFieldError;
