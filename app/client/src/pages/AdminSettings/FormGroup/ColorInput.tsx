import React, { memo, useRef, useCallback, useState } from "react";
import type { WrappedFieldInputProps, WrappedFieldMetaProps } from "redux-form";
import { Field } from "redux-form";
import { startCase } from "lodash";
import tinycolor from "tinycolor2";
import styled from "styled-components";
import { Icon, Text, Tooltip } from "@appsmith/ads";
import { InputGroup, Classes } from "@blueprintjs/core";
import Color from "colorjs.io";

import type { SettingComponentProps } from "./Common";
import { FormGroup } from "./Common";
import type { FormTextFieldProps } from "components/utils/ReduxFormTextField";
import { createBrandColorsFromPrimaryColor } from "utils/BrandingUtils";
import type { brandColorsKeys } from "../Branding/BrandingPage";
import { ContentBox } from "../components";

export const StyledInputGroup = styled(InputGroup)`
  .${Classes.INPUT} {
    box-shadow: none;
    border-radius: var(--ads-v2-border-radius);
    &:focus {
      box-shadow: none;
    }
  }
  input[type="color"]::-webkit-color-swatch {
    border: none;
    border-radius: 50%;
    padding: 0;
  }
  input[type="color"]::-webkit-color-swatch-wrapper {
    border: none;
    border-radius: 50%;
    padding: 0;
  }
  &&& input {
    padding-left: 36px;
    height: 36px;
    border: 1px solid var(--ads-v2-color-border);
    background: var(--ads-v2-color-bg);
    color: var(--ads-v2-color-fg);
    &:focus {
      border: 1px solid var(--ads-v2-color-border-emphasis-plus);
    }
  }
`;

const StyledColorInputIcon = styled.input`
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background-color: transparent;
  border: none;
  cursor: pointer;
  position: absolute;
  top: 8px;
  left: 8px;
  bottom: 0;
  width: 20px;
  height: 20px !important;
  padding-left: 0 !important;
  border: red;
  z-index: 1;
  display: flex;
  border: 1px solid var(--ads-v2-color-border);
  border-radius: 100%;
  &::-webkit-color-swatch {
    border-radius: 15px;
    border: none;
  }
  &::-moz-color-swatch {
    border-radius: 15px;
    border: none;
  }
`;

const StyledText = styled(Text)`
  font-weight: 500;
`;

interface ColorInputProps {
  value: Record<brandColorsKeys, string>;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange?: (value: any) => void;
  className?: string;
  tooltips?: Record<brandColorsKeys, string>;
  filter?: (key: brandColorsKeys) => boolean;
  defaultValue?: Record<brandColorsKeys, string>;
  logEvent?: (property: string) => void;
}

const LeftIcon = (
  props: Omit<ColorInputProps, "value"> & { value: string },
) => {
  const { onChange, value } = props;

  return (
    <StyledColorInputIcon onChange={onChange} type="color" value={value} />
  );
};

export const ColorInput = (props: ColorInputProps) => {
  const [selectedIndex, setSelectedIndex] =
    useState<brandColorsKeys>("primary");
  const {
    className,
    filter = () => true,
    logEvent,
    onChange,
    tooltips,
    value,
  } = props;
  const colorInputRef = useRef<HTMLInputElement>(null);

  const onColorInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      let shades = value;

      shades[selectedIndex] = e.target.value;

      logEvent && logEvent(selectedIndex);
      let color = undefined;

      try {
        color = Color.parse(e.target.value);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error);
      }

      // if user is touching the primary color
      // then we need to update the shades
      if (selectedIndex === "primary" && color) {
        shades = createBrandColorsFromPrimaryColor(e.target.value);
      }

      onChange && onChange(shades);
    },
    [onChange, selectedIndex, value],
  );

  // if the selected color is empty, use the white color for left icon
  const hex = value[selectedIndex]
    ? tinycolor(value[selectedIndex]).toHexString()
    : "#ffffff";
  const colorKeys = Object.keys(value) as brandColorsKeys[];

  return (
    <>
      <div className="flex mb-2 space-x-1 border-gray-300 t--color-input-shades">
        {/* selectable color shades */}
        {colorKeys.filter(filter).map((colorKey: brandColorsKeys, index) => (
          <Tooltip
            className="flex-1"
            content={startCase(colorKey)}
            key={colorKey}
          >
            <ContentBox
              className={`flex-grow w-5 h-5 cursor-pointer p-px relative border ${
                selectedIndex === colorKey
                  ? "border-gray-700 bg-clip-content"
                  : "border-gray-200 hover:border-gray-400"
              }`}
              data-id={colorKey}
              key={`shades-${colorKey}-${index}`}
              onClick={() => setSelectedIndex(colorKey)}
              style={{ backgroundColor: value[colorKey] }}
            />
          </Tooltip>
        ))}
      </div>

      <input
        className="hidden w-0 h-0"
        readOnly
        ref={colorInputRef}
        type="color"
        value={value[selectedIndex]} // convert to hex for safari compatibility
      />

      {/* label with tooltip */}
      <div className="flex items-center gap-1">
        <StyledText
          color="var(--ads-v2-color-fg)"
          kind="body-m"
          renderAs="label"
        >
          {startCase(selectedIndex)}
        </StyledText>
        <Tooltip
          content={tooltips && tooltips[selectedIndex]}
          key={`tooltip-${selectedIndex}`}
        >
          <Icon className="help-icon" name="question-line" size="md" />
        </Tooltip>
      </div>

      <StyledInputGroup
        className={`mb-2 ${className ? className : ""}`}
        leftIcon={<LeftIcon onChange={onColorInputChange} value={hex} />}
        onChange={onColorInputChange}
        placeholder="enter color name or hex"
        value={value[selectedIndex]}
      />
    </>
  );
};

export function FieldColorInput() {
  return function FieldCheckbox(
    componentProps: FormTextFieldProps & {
      meta: Partial<WrappedFieldMetaProps>;
      input: Partial<WrappedFieldInputProps>;
    },
  ) {
    return (
      <ColorInput
        onChange={componentProps.input.onChange}
        value={componentProps.input.value}
      />
    );
  };
}

export function ColorInputComponent({ setting }: SettingComponentProps) {
  return (
    <FormGroup setting={setting}>
      <Field component={FieldColorInput()} name={setting.name} />
    </FormGroup>
  );
}

export default memo(ColorInputComponent);
