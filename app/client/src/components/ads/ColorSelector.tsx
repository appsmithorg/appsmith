import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { CommonComponentProps } from "./common";

export type ColorSelectorProps = CommonComponentProps & {
  onSelect?: (hex: string) => void;
  colorPalette: string[];
  fill?: boolean;
  defaultValue?: string;
};

const Palette = styled.div<{ fill?: boolean }>`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  padding: ${(props) => props.theme.spaces[4]}px
    ${(props) => props.theme.spaces[5]}px;
  width: ${(props) => (props.fill ? "100%" : "234px")};
`;

const ColorBox = styled.div<{ selected: string; color: string }>`
  width: ${(props) => props.theme.spaces[8]}px;
  height: ${(props) => props.theme.spaces[8]}px;
  margin: 0 ${(props) => props.theme.spaces[2]}px
    ${(props) => props.theme.spaces[2]}px 0;
  background-color: ${(props) => props.color};
  cursor: pointer;
  position: relative;

  &:hover {
    box-shadow: 0px 0px 0px ${(props) => props.theme.spaces[1] - 1}px
      ${(props) => props.theme.colors.colorSelector.shadow};
  }

  &:nth-child(9n) {
    margin-right: 0px;
  }

  ${(props) =>
    props.selected === props.color
      ? `&::before {
    content: "";
    position: absolute;
    left: ${props.theme.spaces[3] - 1}px;
    top: ${props.theme.spaces[1] - 1}px;
    width: ${props.theme.spaces[2] - 1}px;
    height: ${props.theme.spaces[4] - 1}px;
    border: 2px solid ${props.theme.colors.colorSelector.checkmark};
    border-width: 0 2px 2px 0;
    transform: rotate(45deg); 
  }`
      : `
  &::before {
    display: none;
  }
  `}
`;

function ColorSelector(props: ColorSelectorProps) {
  const [selected, setSelected] = useState<string>(
    props.defaultValue || props.colorPalette[0],
  );

  useEffect(() => {
    if (props.defaultValue) {
      setSelected(props.defaultValue);
    }
  }, [props.defaultValue]);

  return (
    <Palette data-cy={props.cypressSelector} fill={props.fill}>
      {props.colorPalette.map((hex: string, index: number) => {
        return (
          <ColorBox
            className={
              selected === hex ? "t--color-selected" : "t--color-not-selected"
            }
            color={hex}
            key={index}
            onClick={() => {
              if (selected !== hex) {
                setSelected(hex);
                props.onSelect && props.onSelect(hex);
              }
            }}
            selected={selected}
          />
        );
      })}
    </Palette>
  );
}

ColorSelector.defaultProps = {
  fill: false,
};

export default ColorSelector;
