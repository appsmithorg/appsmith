import React from "react";
import styled from "styled-components";
// Note: This component is only for the input fields which donot have the
// popover error tooltip. This is also only for Appsmith components
// Not to be used in widgets / canvas

const StyledError = styled.span<{ show: boolean }>`
  text-align: left;
  color: var(--ads-v2-color-fg-error);
  font-size: var(--ads-font-size-3);
  opacity: ${(props) => (props.show ? 1 : 0)};
  display: block;
  position: relative;
  margin-top: var(--ads-spaces-1);
`;

interface FormFieldErrorProps {
  error?: string;
  className?: string;
}

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
