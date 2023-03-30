/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState } from "react";
import type { ReactElement } from "react";
import type { OptionProps } from "design-system-old";
import {
  IconWrapper,
  // Radio,
  Text,
  TextType,
  IconSize,
} from "design-system-old";
import { Popover2 } from "@blueprintjs/popover2";
import type { SettingComponentProps } from "./Common";
import { FormGroup } from "./Common";
import type { WrappedFieldInputProps, WrappedFieldMetaProps } from "redux-form";
import { Field } from "redux-form";
import { FieldError } from "design-system-old";
import { Colors } from "constants/Colors";
import styled from "styled-components";
import { Position } from "@blueprintjs/core";
import { RadioGroup, Radio, Tag, Button } from "design-system";

type RadioOption = {
  node?: ReactElement;
  nodeLabel?: string;
  nodeInputPath?: string;
  nodeParentClass?: string;
  badge?: string;
  tooltip?: {
    icon: any;
    text: string;
    linkText: string;
    link: string;
  };
} & OptionProps;
export type RadioProps = {
  options: RadioOption[];
};

const StyledTag = styled(Tag)<{ selected?: boolean }>`
  /* background-color: ${(props) =>
    props.selected
      ? "var(--ads-v2-color-bg-warning)"
      : "var(--ads-v2-color-bg-information"};
  color: ${(props) =>
    props.selected
      ? "var(--ads-v2-color-fg-warning)"
      : "var(--ads-v2-color-fg-information)"}; */
  margin-left: 4px;
`;

const TooltipContent = styled.div`
  width: 300px;
  padding: 12px;

  a {
    justify-content: flex-start;
    padding: 0;
    margin-top: 4px;
    text-decoration: underline;
  }

  .tooltip-text {
    line-height: 1.17;
  }
`;

const SuffixWrapper = styled.div`
  display: inline-flex;
  align-items: center;
`;

const NodeWrapper = styled.div`
  margin-left: 27px;
  margin-top: 8px;
`;

type RadioGroupProps = SettingComponentProps;

function RadioFieldWrapper(
  componentProps: {
    meta: Partial<WrappedFieldMetaProps>;
    input: Partial<WrappedFieldInputProps>;
  } & RadioProps,
) {
  function onChangeHandler(value: string) {
    setValue(value);
    componentProps.input.onChange &&
      componentProps.input.onChange({
        value,
        additionalData: componentProps.input.value.additionalData,
      });
  }

  function onInputNodeChangeHandler(value?: any) {
    componentProps.input.onChange &&
      componentProps.input.onChange({
        value: componentProps.input.value.value,
        additionalData: value,
      });
    componentProps.input.onBlur &&
      componentProps.input.onBlur({
        value: componentProps.input.value.value,
        additionalData: value,
      });
  }

  const [value, setValue] = useState<string>("");

  useEffect(() => {
    setValue(componentProps.input.value.value);
  }, [componentProps.input.value]);

  return (
    <RadioGroup onChange={onChangeHandler as any} value={value}>
      {componentProps.options.map((item) => {
        const isSelected = item.value === value;

        return (
          <React.Fragment key={item.value}>
            <Radio value={item.value}>
              {item.label}
              <SuffixWrapper>
                {item.badge && (
                  <StyledTag isClosable={false} selected={isSelected} size="sm">
                    {item.badge}
                  </StyledTag>
                )}
                {item.tooltip && (
                  <Popover2
                    content={
                      <TooltipContent>
                        <Text
                          className="tooltip-text"
                          color="var(--ads-v2-color-fg)"
                          type={TextType.P3}
                        >
                          {item.tooltip.text}
                        </Text>
                        <Button
                          href={item.tooltip.link}
                          renderAs="a"
                          size="sm"
                          target="_blank"
                        >
                          {item.tooltip.linkText}
                        </Button>
                      </TooltipContent>
                    }
                    position={Position.RIGHT}
                  >
                    <IconWrapper
                      className="icon"
                      fillColor="var(--ads-color-black-470)"
                      size={IconSize.MEDIUM}
                    >
                      {item.tooltip.icon}
                    </IconWrapper>
                  </Popover2>
                )}
              </SuffixWrapper>
            </Radio>
            {item.node && isSelected && item.nodeInputPath && (
              <NodeWrapper className={item.nodeParentClass}>
                <Text color={Colors.GRAY_700} type={TextType.P3}>
                  {item.nodeLabel}
                </Text>
                {React.cloneElement(item.node, {
                  [item.nodeInputPath]: {
                    value: componentProps.input.value.additionalData,
                    onChange: onInputNodeChangeHandler,
                  },
                })}
                {componentProps.meta.error && (
                  <FieldError error={componentProps.meta.error} />
                )}
              </NodeWrapper>
            )}
          </React.Fragment>
        );
      })}
    </RadioGroup>
  );
}

export default function RadioField({ setting }: RadioGroupProps) {
  const controlTypeProps = setting.controlTypeProps as RadioProps;

  return (
    <FormGroup
      className={`t--admin-settings-radio t--admin-settings-${
        setting.name || setting.id
      }`}
      setting={setting}
    >
      <Field
        component={RadioFieldWrapper}
        {...controlTypeProps}
        format={setting.format}
        name={setting.name}
        parse={setting.parse}
      />
    </FormGroup>
  );
}
