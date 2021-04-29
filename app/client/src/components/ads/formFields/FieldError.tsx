import React from "react";
import styled from "styled-components";
import { IntentColors } from "constants/DefaultTheme";
// Note: This component is only for the input fields which donot have the
// popover error tooltip. This is also only for Appsmith components
// Not to be used in widgets / canvas

const StyledError = styled.span<{ show: boolean }>`
  text-align: left;
  color: ${IntentColors.danger};
  font-size: ${(props) => props.theme.fontSizes[3]}px;
  opacity: ${(props) => (props.show ? 1 : 0)};
  display: block;
  position: relative;
  margin-top: ${(props) => props.theme.spaces[1]}px;
`;

type FormFieldErrorProps = {
  error?: string;
  className?: string;
};

export function FormFieldError(props: FormFieldErrorProps) {
  return (
    <StyledError
      className={props.className ? props.className : undefined}
      show={!!props.error}
    >
      {props.error || "&nbsp;"}
    </StyledError>
  );
}

export default FormFieldError;
