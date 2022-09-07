import React, { useState, ReactElement } from "react";
import { OptionProps, Radio } from "design-system";
import { FormGroup, SettingComponentProps } from "./Common";
import {
  Field,
  WrappedFieldInputProps,
  WrappedFieldMetaProps,
} from "redux-form";

type RadioOption = {
  childNode?: ReactElement;
  childNodeInputPath?: string;
} & OptionProps;
export type RadioProps = {
  options: RadioOption[];
};

type RadioGroupProps = SettingComponentProps;

function RadioFieldWrapper(props: RadioProps) {
  return function RadioGroup(componentProps: {
    meta: Partial<WrappedFieldMetaProps>;
    input: Partial<WrappedFieldInputProps>;
  }) {
    const [selected] = useState(componentProps.input.value.value);

    function onChangeHandler(e?: any) {
      componentProps.input.onChange &&
        componentProps.input.onChange({
          value: e.target.value,
        });
    }

    function onInputNodeChangeHandler(value?: any) {
      componentProps.input.onChange &&
        componentProps.input.onChange({
          value: componentProps.input.value,
          additionalData: value,
        });
      componentProps.input.onBlur &&
        componentProps.input.onBlur({
          value: componentProps.input.value,
          additionalData: value,
        });
    }

    return (
      <div>
        {props.options.map((item) => {
          return (
            <div key={item.value}>
              <Radio>
                {item.label}
                <input
                  checked={selected === item.value}
                  onChange={onChangeHandler}
                  type="radio"
                  value={item.value}
                />
                <span className="checkbox" />
              </Radio>
              {item.childNode &&
                selected === item.value &&
                item.childNodeInputPath &&
                React.cloneElement(item.childNode, {
                  [item.childNodeInputPath]: {
                    value: componentProps.input.value.additionalData,
                    onchange: onInputNodeChangeHandler,
                  },
                })}
            </div>
          );
        })}
      </div>
    );
  };
}

export default function RadioField({ setting }: RadioGroupProps) {
  const controlTypeProps = setting.controlTypeProps as RadioProps;

  return (
    <FormGroup
      className={`t--admin-settings-dropdown t--admin-settings-${setting.name ||
        setting.id}`}
      setting={setting}
    >
      <Field
        component={RadioFieldWrapper({
          options: controlTypeProps.options,
        })}
        format={setting.format}
        name={setting.name}
        normalize={setting.normalize}
      />
    </FormGroup>
  );
}
