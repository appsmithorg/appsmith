import { CommonComponentProps } from "./common";
import React, { useState, useEffect } from "react";
import styled from "styled-components";

type OptionProps = {
  label: string;
  value: string;
  disabled?: boolean;
  onSelect?: (value: string) => void;
};

type RadioProps = CommonComponentProps & {
  columns?: number;
  rows?: number;
  defaultValue: string;
  onSelect?: (value: string) => void;
  options: OptionProps[];
};

const RadioGroup = styled.div<{
  rows?: number;
}>`
  display: flex;
  flex-wrap: wrap;
  ${props =>
    props.rows && props.rows > 0
      ? `
      flex-direction: column;
      height: 100%;
      `
      : null};
`;

const Radio = styled.label<{
  disabled?: boolean;
  columns?: number;
  rows?: number;
}>`
  display: block;
  position: relative;
  padding-left: ${props => props.theme.spaces[12] - 2}px;
  cursor: ${props => (props.disabled ? "not-allowed" : "pointer")};
  font-size: ${props => props.theme.typography.p1.fontSize}px;
  font-weight: ${props => props.theme.typography.p1.fontWeight};
  line-height: ${props => props.theme.typography.p1.lineHeight}px;
  letter-spacing: ${props => props.theme.typography.p1.letterSpacing}px;
  color: ${props => props.theme.colors.radio.text};
  ${props =>
    props.rows && props.rows > 0
      ? `flex-basis: calc(100% / ${props.rows})`
      : null};
  ${props =>
    props.columns && props.columns > 0
      ? `
        flex-basis: calc(100% / ${props.columns});
        margin-bottom: ${props.theme.spaces[11] + 1}px;
        `
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
    width: ${props => props.theme.spaces[8]}px;
    height: ${props => props.theme.spaces[8]}px;
    background-color: transparent;
    border: ${props => props.theme.spaces[1] - 2}px solid
      ${props => props.theme.colors.radio.border};
    border-radius: 50%;
    margin-top: ${props => props.theme.spaces[0]}px;
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
    background-color: ${props => props.theme.colors.radio.disabled};
  }

  .checkbox:after {
    content: "";
    position: absolute;
    width: ${props => props.theme.spaces[4]}px;
    height: ${props => props.theme.spaces[4]}px;
    ${props =>
      props.disabled
        ? `background-color: ${props.theme.colors.radio.disabled}`
        : `background-color: ${props.theme.colors.info.main};`};
    top: ${props => props.theme.spaces[1] - 2}px;
    left: ${props => props.theme.spaces[1] - 2}px;
    border-radius: 50%;
  }
`;

export default function RadioComponent(props: RadioProps) {
  const [selected, setSelected] = useState(props.defaultValue);

  useEffect(() => {
    if (props.rows && props.columns && props.rows > 0 && props.columns > 0) {
      console.error(
        "Please pass either rows prop or column prop but not both.",
      );
    }
  }, [props]);

  useEffect(() => {
    setSelected(props.defaultValue);
  }, [props.defaultValue]);

  const onChangeHandler = (value: string) => {
    setSelected(value);
    props.onSelect && props.onSelect(value);
  };

  return (
    <RadioGroup
      data-cy={props.cypressSelector}
      rows={props.rows}
      onChange={(e: any) => onChangeHandler(e.target.value)}
    >
      {props.options.map((option: OptionProps, index: number) => (
        <Radio
          key={index}
          columns={props.columns}
          rows={props.rows}
          disabled={props.disabled || option.disabled}
        >
          {option.label}
          <input
            type="radio"
            value={option.value}
            disabled={props.disabled || option.disabled}
            onChange={e => option.onSelect && option.onSelect(e.target.value)}
            checked={selected === option.value}
            name="radio"
          />
          <span className="checkbox"></span>
        </Radio>
      ))}
    </RadioGroup>
  );
}
