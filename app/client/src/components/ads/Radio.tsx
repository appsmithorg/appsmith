import { CommonComponentProps } from "./common";
import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { RadioGroup, Radio } from "@blueprintjs/core";

type OptionProps = {
  label: string;
  value: string;
  disabled?: boolean;
};

type Align = "horizontal" | "vertical" | "column" | "row";

type RadioProps = CommonComponentProps & {
  align?: Align;
  columns?: number;
  rows?: number;
  rowsHeight?: string;
  defaultValue: string;
  onSelect?: (value: string) => void;
  options: OptionProps[];
};

const RadioContainer = styled.div<{
  disabled?: boolean;
  align?: Align;
  columns?: number;
  rows?: number;
  rowsHeight?: string;
}>`
  .radio-group-container {
    display: flex;
    ${props =>
      props.align === "vertical" || props.align === "row"
        ? `flex-direction: column`
        : null};
    flex-wrap: wrap;
    height: ${props => props.rowsHeight};
  }

  &&&& .bp3-control {
    font-size: ${props => props.theme.typography.p1.fontSize}px;
    font-weight: ${props => props.theme.typography.p1.fontWeight};
    line-height: ${props => props.theme.typography.p1.lineHeight}px;
    letter-spacing: ${props => props.theme.typography.p1.letterSpacing}px;
    color: ${props => props.theme.colors.blackShades[9]};
    ${props =>
      props.align === "row" ? `flex-basis: calc(100% / ${props.rows})` : null};
    ${props =>
      props.align === "column"
        ? `flex-basis: calc(100% / ${props.columns})`
        : null};
    ${props =>
      props.align === "horizontal"
        ? `margin-right: ${props.theme.spaces[11] + 1}px`
        : null};
    ${props =>
      props.align === "vertical" || props.align === "column"
        ? `margin-bottom: ${props.theme.spaces[11] + 1}px`
        : `margin-bottom: ${props.theme.spaces[0]}px`};
  }

  &&&& .bp3-control .bp3-control-indicator {
    width: ${props => props.theme.spaces[8]}px;
    height: ${props => props.theme.spaces[8]}px;
    box-shadow: none;
    background-image: none;
    background-color: transparent;
    border: ${props => props.theme.spaces[1] - 2}px solid
      ${props => props.theme.colors.blackShades[4]};
    margin-top: ${props => props.theme.spaces[0]}px;
  }

  &&&&
    .bp3-control.bp3-radio
    input:checked:disabled
    ~ .bp3-control-indicator::before {
    background-color: ${props => props.theme.colors.disabled};
  }

  &&&& .bp3-control.bp3-radio input:checked ~ .bp3-control-indicator::before {
    content: "";
    position: absolute;
    width: ${props => props.theme.spaces[4]}px;
    height: ${props => props.theme.spaces[4]}px;
    ${props =>
      props.disabled
        ? `background-color: ${props.theme.colors.disabled}`
        : `background-color: ${props.theme.colors.info.main};`};
    top: ${props => props.theme.spaces[1] - 2}px;
    left: ${props => props.theme.spaces[1] - 2}px;
    background-image: none;
    border-radius: 50%;
  }
`;

export default function RadioComponent(props: RadioProps) {
  const [selected, setSelected] = useState(props.defaultValue);

  useEffect(() => {
    setSelected(props.defaultValue);
  }, [props.defaultValue]);

  const onChangeHandler = (value: string) => {
    setSelected(value);
    props.onSelect && props.onSelect(value);
  };

  return (
    <RadioContainer
      disabled={props.disabled}
      align={props.align}
      columns={props.columns}
      rows={props.rows}
      rowsHeight={props.rowsHeight}
    >
      <RadioGroup
        disabled={props.disabled}
        className="radio-group-container"
        onChange={(event: React.FormEvent<HTMLInputElement>) =>
          onChangeHandler(event.currentTarget.value)
        }
        selectedValue={selected}
      >
        {props.options.map((option: OptionProps, index: number) => (
          <Radio
            label={option.label}
            key={index}
            value={option.value}
            disabled={option.disabled}
          />
        ))}
      </RadioGroup>
    </RadioContainer>
  );
}
