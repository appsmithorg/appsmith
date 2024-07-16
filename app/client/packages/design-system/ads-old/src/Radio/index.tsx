import type { CommonComponentProps } from "../types/common";
import React, { useState, useEffect } from "react";
import styled from "styled-components";
import * as log from "loglevel";
import { typography } from "../constants/typography";

export interface OptionProps {
  label: string;
  value: string;
  disabled?: boolean;
  onSelect?: (value: string) => void;
}

export type RadioProps = CommonComponentProps & {
  columns?: number;
  rows?: number;
  defaultValue: string;
  onSelect?: (value: string) => void;
  options: OptionProps[];
  selectedOptionElements?: Array<JSX.Element | null>;
  backgroundColor?: string;
  // To prevent interference when there are multiple radio groups,
  // options corresponding to the same radio should have same name, which is different from others.
  name?: string;
};

const RadioGroup = styled.div<{
  rows?: number;
  columns?: number;
}>`
  display: flex;
  flex-wrap: wrap;
  ${(props) =>
    props.rows && props.rows > 0
      ? `
      flex-direction: column;
      height: 100%;
      `
      : props.columns && props.columns > 0
        ? `
      width: 100%;`
        : null};
`;

export const Radio = styled.label<{
  disabled?: boolean;
  columns?: number;
  rows?: number;
  backgroundColor?: string;
}>`
  display: block;
  position: relative;
  padding-left: calc(var(--ads-spaces-12) - 2px);
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  font-size: ${typography.p1.fontSize}px;
  font-weight: ${typography.p1.fontWeight};
  line-height: ${typography.p1.lineHeight}px;
  letter-spacing: ${typography.p1.letterSpacing}px;
  color: var(--ads-radio-default-text-color);
  ${(props) =>
    props.columns && props.columns > 0
      ? `
        flex-basis: calc(100% / ${props.columns});
        `
      : props.rows && props.rows > 0
        ? `
        margin-bottom: calc(var(--ads-spaces-11) + 1px);`
        : null};

  input {
    position: absolute;
    opacity: 0;
    cursor: pointer;
  }

  .checkbox {
    position: absolute;
    top: 0;
    left: 0;
    width: var(--ads-spaces-8);
    height: var(--ads-spaces-8);
    background-color: transparent;
    border: calc(var(--ads-spaces-1) - 2px) solid
      var(--ads-radio-default-border-color);
    border-radius: 50%;
    margin-top: 0px;
  }

  .checkbox:after {
    content: "";
    position: absolute;
    display: none;
  }

  input:checked ~ .checkbox:after {
    display: block;
  }

  input:disabled ~ .checkbox:after {
    background-color: var(--ads-radio-disabled-background-color);
  }

  .checkbox:after {
    content: "";
    position: absolute;
    width: var(--ads-spaces-4);
    height: var(--ads-spaces-4);
    ${(props) =>
      props.disabled
        ? `background-color: var(--ads-radio-disabled-background-color)`
        : `background-color: ${
            props.backgroundColor || `var(--ads-info-main-text-color)`
          }`};
    top: 2px;
    left: 2px;
    border-radius: 50%;
  }
`;

export default function RadioComponent(props: RadioProps) {
  const [selected, setSelected] = useState(props.defaultValue);
  const { onSelect } = props;

  useEffect(() => {
    if (props.rows && props.columns && props.rows > 0 && props.columns > 0) {
      log.error("Please pass either rows prop or column prop but not both.");
    }
  }, [props]);

  useEffect(() => {
    setSelected(props.defaultValue);
  }, [props.defaultValue]);

  const onChangeHandler = (e: any) => {
    if (!e.target?.closest(".t--radioSelectedOptionElement")) {
      const value: string = e.target.value;
      setSelected(value);
      onSelect && onSelect(value);
    }
  };

  return (
    <RadioGroup
      className={props.className}
      columns={props.columns}
      data-cy={props.cypressSelector}
      rows={props.rows}
    >
      {props.options.map((option: OptionProps, index: number) => (
        <React.Fragment key={index}>
          <Radio
            backgroundColor={props.backgroundColor}
            columns={props.columns}
            disabled={props.disabled || option.disabled}
            key={index}
            rows={props.rows}
          >
            {option.label}
            <input
              checked={selected === option.value}
              disabled={props.disabled || option.disabled}
              name={props.name || "radio"}
              onChange={onChangeHandler}
              type="radio"
              value={option.value}
            />
            <span className="checkbox" />
          </Radio>
          {selected === option.value && (
            <div className="t--radioSelectedOptionElement">
              {props.selectedOptionElements?.[index]}
            </div>
          )}
        </React.Fragment>
      ))}
    </RadioGroup>
  );
}
