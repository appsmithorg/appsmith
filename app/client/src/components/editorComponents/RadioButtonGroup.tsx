import React, { useEffect, useState, useRef } from "react";
import styled from "styled-components";
import { Text, Button } from "design-system";
import type { WrappedFieldMetaProps, WrappedFieldInputProps } from "redux-form";

type RadioButtonGroupProps = {
  options: RadioButtonProps[];
  label: string;
  initialValue: string;
  meta?: Partial<WrappedFieldMetaProps>;
  input?: Partial<WrappedFieldInputProps>;
};

type RadioButtonProps = {
  label: string;
  value: string;
};

const StyledButton = styled(Button)`
  &[aria-checked="true"] {
    border: 2px solid black;
  }
`;

const RadioButtonGroupContainer = styled.div`
  & .radio_group__label {
    margin-bottom: 0.8rem;
  }
`;

const RadioButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
`;

const RadioGroupErrorContainer = styled.div`
  font-size: 12px;
  color: var(--ads-v2-color-fg-error);
`;

const RadioButton = ({ label = "", value = "" }: RadioButtonProps) => {
  return (
    <StyledButton
      aria-checked={"false"}
      className="radio-group__button"
      data-label={label}
      data-value={value}
      kind="secondary"
      role="radio"
      size={"md"}
      tabIndex={-1}
    >
      {value}
    </StyledButton>
  );
};

const RadioButtonGroup = ({
  initialValue = "",
  input,
  label,
  meta,
  options,
}: RadioButtonGroupProps) => {
  const [value, setValue] = useState(initialValue);
  const buttonGroupRef = useRef<HTMLDivElement | null>(null);
  const prevCheckedButtonRef = useRef<HTMLElement | null>(null);

  const hasError = (!!meta && meta.invalid && meta.touched) || false;

  useEffect(() => {
    if (buttonGroupRef.current) {
      const checkedButton: HTMLElement | null =
        buttonGroupRef.current.querySelector(
          `button[role="radio"][data-value="${value}"]`,
        );

      if (!!checkedButton) {
        // update prev checked button
        if (!!prevCheckedButtonRef?.current) {
          prevCheckedButtonRef.current.setAttribute("aria-checked", "false");
        }

        checkedButton.setAttribute("aria-checked", "true");
        prevCheckedButtonRef.current = checkedButton;
      }
    }
  }, [value]);

  const onClickHandler = (event: any) => {
    if (!!event.target && event.target instanceof HTMLElement) {
      const clickedButton: HTMLElement | null = event.target.closest(
        "button[role='radio']",
      );

      if (clickedButton) {
        const value = clickedButton.dataset.value || "";
        setValue(value);

        // if redux form field input exists, update state as well.
        !!input && input?.onChange && input.onChange(value);
      }
    }
  };

  return (
    <RadioButtonGroupContainer
      aria-label={label}
      className="radio_group"
      role="radiogroup"
    >
      <Text
        className="radio_group__label"
        color="var(--ads-v2-color-fg-emphasis)"
        kind="heading-s"
        renderAs="h5"
      >
        {" "}
        {label}{" "}
      </Text>
      <RadioButtonContainer
        className="radio_group__button_container"
        onClick={onClickHandler}
        ref={buttonGroupRef}
      >
        {options.map((option, index) => (
          <RadioButton key={index} label={option.label} value={option.value} />
        ))}
      </RadioButtonContainer>

      {hasError && !!meta && (
        <RadioGroupErrorContainer className="dropdown-errorMsg">
          {meta.error}
        </RadioGroupErrorContainer>
      )}
    </RadioButtonGroupContainer>
  );
};

export default RadioButtonGroup;
