import React, { useEffect, useState, useRef } from "react";
import styled from "styled-components";
import { Text, Button } from "@appsmith/ads";
import type { WrappedFieldMetaProps, WrappedFieldInputProps } from "redux-form";

interface RadioButtonGroupProps {
  options: RadioButtonProps[];
  label: string;
  initialValue: string;
  meta?: Partial<WrappedFieldMetaProps>;
  input?: Partial<WrappedFieldInputProps>;
  showSubtitle?: boolean;
  testid: string;
}

interface RadioButtonProps {
  label: string;
  subtext?: string;
  value: string;
}

const StyledButton = styled(Button)`
  width: 160px;
  flex-shrink: 0;
  &[aria-checked="true"] > div {
    border-color: var(--ads-v2-color-border-brand);
    & .ads-v2-button__content-children {
      color: var(--ads-v2-color-border-brand);
    }
  }
`;

const RadioButtonGroupContainer = styled.div`
  & .radio_group__label {
    margin-bottom: 0.5rem;
  }
`;

const RadioButtonContainer = styled.div`
  display: flex;
  gap: 0.7rem;
  flex-wrap: wrap;
`;

const RadioGroupErrorContainer = styled.div`
  font-size: 12px;
  color: var(--ads-v2-color-fg-error);
`;

const ContainerHeading = styled(Text)`
  font-size: var(--ads-font-size-4);
  font-weight: var(--ads-font-weight-bold-xl);
  color: var(--ads-v2-color-gray-700);
`;

const SubTitleWrapper = styled(Text)<{ isHidden: boolean }>`
  ${(props) => props.isHidden && `opacity: 0; visibility: hidden;`}
  margin-top: var(--ads-v2-spaces-4);
  display: block;
  color: var(--ads-v2-color-gray-500);
  font-size: var(--ads-font-size-2);
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
      {label}
    </StyledButton>
  );
};

const RadioButtonGroup = ({
  initialValue = "",
  input,
  label,
  meta,
  options,
  showSubtitle,
  testid,
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

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  const selectedOption = options.find((option) => option.value === value);

  return (
    <RadioButtonGroupContainer
      aria-label={label}
      className="radio_group"
      role="radiogroup"
    >
      <ContainerHeading
        className="radio_group__label"
        color="var(--ads-v2-color-fg)"
        kind="body-m"
        renderAs="h5"
      >
        {label}
      </ContainerHeading>
      <RadioButtonContainer
        className="radio_group__button_container"
        data-testid={testid}
        onClick={onClickHandler}
        ref={buttonGroupRef}
      >
        {options.map((option, index) => (
          <RadioButton key={index} label={option.label} value={option.value} />
        ))}
      </RadioButtonContainer>
      {showSubtitle && (
        <SubTitleWrapper isHidden={!selectedOption?.subtext}>
          {selectedOption?.subtext} &nbsp;
        </SubTitleWrapper>
      )}
      {hasError && !!meta && (
        <RadioGroupErrorContainer className="dropdown-errorMsg">
          {meta.error}
        </RadioGroupErrorContainer>
      )}
    </RadioButtonGroupContainer>
  );
};

export default RadioButtonGroup;
