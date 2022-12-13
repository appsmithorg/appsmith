import React, { memo, useRef, useCallback, useState } from "react";
import {
  Field,
  WrappedFieldInputProps,
  WrappedFieldMetaProps,
} from "redux-form";
import { startCase } from "lodash";
import tinycolor from "tinycolor2";
import styled from "styled-components";
import { TooltipComponent } from "design-system";
import { InputGroup, Classes } from "@blueprintjs/core";
import QuestionIcon from "remixicon-react/QuestionFillIcon";

import { FormGroup, SettingComponentProps } from "./Common";
import { FormTextFieldProps } from "components/utils/ReduxFormTextField";
import { createBrandColorsFromPrimaryColor } from "utils/BrandingUtils";
import { brandColorsKeys } from "../config/branding/BrandingPage";

export const StyledInputGroup = styled(InputGroup)`
  .${Classes.INPUT} {
    box-shadow: none;
    border-radius: 0;
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
    border: 1px solid var(--appsmith-color-black-500);
    background: ${(props) =>
      props.theme.colors.propertyPane.multiDropdownBoxHoverBg};
    color: ${(props) => props.theme.colors.propertyPane.label};
    &:focus {
      border: 1px solid var(--appsmith-color-black-900);
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
  top: 6px;
  left: 8px;
  bottom: 0;
  width: 22px;
  height: 22px !important;
  padding-left: 0 !important;
  border: red;
  z-index: 1;
  display: flex;
  border: 1px solid var(--ads-text-input-text-box-default-border-color);
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

type ColorInputProps = {
  value: Record<brandColorsKeys, string>;
  onChange?: (value: any) => void;
  className?: string;
  tooltips?: Record<brandColorsKeys, string>;
  filter?: (key: brandColorsKeys) => boolean;
  defaultValue?: Record<brandColorsKeys, string>;
  logEvent?: (property: string) => void;
};

const LeftIcon = (
  props: Omit<ColorInputProps, "value"> & { value: string },
) => {
  const { onChange, value } = props;
  return (
    <StyledColorInputIcon onChange={onChange} type="color" value={value} />
  );
};

export const ColorInput = (props: ColorInputProps) => {
  const [selectedIndex, setSelectedIndex] = useState<brandColorsKeys>(
    "primary",
  );
  const {
    className,
    onChange,
    tooltips,
    value,
    filter = () => true,
    logEvent,
  } = props;
  const colorInputRef = useRef<HTMLInputElement>(null);

  const onColorInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      let shades = value;

      shades[selectedIndex] = e.target.value;

      logEvent && logEvent(selectedIndex);

      // if user is touching the primary color
      // then we need to update the shades
      if (selectedIndex === "primary") {
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
          <TooltipComponent
            className="flex-1"
            content={startCase(colorKey)}
            key={colorKey}
          >
            <div
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
          </TooltipComponent>
        ))}
      </div>

      <input
        className="hidden w-0 h-0"
        ref={colorInputRef}
        type="color"
        value={value[selectedIndex]} // convert to hex for safari compatibility
      />

      {/* label with tooltip */}
      <div className="flex items-center gap-1">
        <label className="text-sm text-gray-700">
          {startCase(selectedIndex)}
        </label>
        <TooltipComponent
          content={tooltips && tooltips[selectedIndex]}
          key={`tooltip-${selectedIndex}`}
        >
          <QuestionIcon className="w-4 h-4 text-[color:var(--ads-color-black-470)] cursor-help" />
        </TooltipComponent>
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
