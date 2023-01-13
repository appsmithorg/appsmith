import React, { ReactElement } from "react";
import {
  IconWrapper,
  OptionProps,
  Radio,
  Text,
  TextType,
  Button,
  Size,
  IconSize,
} from "design-system";
import { Popover2 } from "@blueprintjs/popover2";
import { FormGroup, SettingComponentProps } from "./Common";
import {
  Field,
  WrappedFieldInputProps,
  WrappedFieldMetaProps,
} from "redux-form";
import { FieldError } from "design-system";
import { Colors } from "constants/Colors";
import styled from "styled-components";
import { Position } from "@blueprintjs/core";

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

const Badge = styled(Text)<{ selected?: boolean }>`
  background-color: ${(props) =>
    props.selected ? Colors.WARNING_ORANGE : Colors.SEA_SHELL};
  padding: 1.5px 5px;
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

const RadioWrapper = styled.div<{ index: number }>`
  ${(props) =>
    props.index > 0 &&
    `
    margin-top: 12.5px;
  `}

  .icon {
    margin-left: 4px;
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
  function onChangeHandler(e?: any) {
    componentProps.input.onChange &&
      componentProps.input.onChange({
        value: e.target.value,
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

  return (
    <div>
      {componentProps.options.map((item, index) => {
        const isSelected = componentProps.input.value.value === item.value;

        return (
          <RadioWrapper index={index} key={item.value}>
            <Radio>
              {item.label}
              <input
                checked={isSelected}
                onChange={onChangeHandler}
                type="radio"
                value={item.value}
              />
              <span className="checkbox" />
              <SuffixWrapper>
                {item.badge && (
                  <Badge
                    color={isSelected ? Colors.WARNING_SOLID : Colors.GRAY_700}
                    selected={isSelected}
                    type={TextType.BUTTON_SMALL}
                  >
                    {item.badge}
                  </Badge>
                )}
                {item.tooltip && (
                  <Popover2
                    content={
                      <TooltipContent>
                        <Text
                          className="tooltip-text"
                          color={Colors.GREY_900}
                          type={TextType.P3}
                        >
                          {item.tooltip.text}
                        </Text>
                        <Button
                          fill={false}
                          href={item.tooltip.link}
                          isLink
                          size={Size.xxs}
                          target="_blank"
                          text={item.tooltip.linkText}
                        />
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
          </RadioWrapper>
        );
      })}
    </div>
  );
}

export default function RadioField({ setting }: RadioGroupProps) {
  const controlTypeProps = setting.controlTypeProps as RadioProps;

  return (
    <FormGroup
      className={`t--admin-settings-radio t--admin-settings-${setting.name ||
        setting.id}`}
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
