import React, { useEffect, useState } from "react";
import type { ReactElement } from "react";
import { FieldError } from "@appsmith/ads-old";
import { Popover2 } from "@blueprintjs/popover2";
import { FormGroup, type SettingComponentProps } from "./Common";
import type { WrappedFieldInputProps, WrappedFieldMetaProps } from "redux-form";
import { Field } from "redux-form";
import styled, { createGlobalStyle } from "styled-components";
import { Position } from "@blueprintjs/core";
import type { RadioProps } from "@appsmith/ads";
import { Icon, Link, Radio, RadioGroup, Tag, Text } from "@appsmith/ads";

type RadioOption = {
  node?: ReactElement;
  nodeLabel?: string;
  nodeInputPath?: string;
  nodeParentClass?: string;
  badge?: string;
  tooltip?: {
    icon: string;
    text: string;
    linkText: string;
    link: string;
  };
  label: string;
} & RadioProps;
export interface RadioOptionProps {
  options: RadioOption[];
}

const StyledTag = styled(Tag)<{ selected?: boolean }>`
  /*
  TODO: handle the colors on the Tag with the new component which will get introduced
  background-color: ${(props) =>
    props.selected ? "var(--ads-v2-color-bg-warning)" : "inital"}; */
  margin-left: 4px;
  /* .ads-v2-text {
    color: ${(props) =>
    props.selected ? "var(--ads-v2-color-fg-warning)" : "initial"};
  }*/
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
    margin-bottom: 8px;
  }
`;

const SuffixWrapper = styled.div`
  display: inline-flex;
  align-items: center;

  .icon {
    margin-left: 4px;

    > svg {
      cursor: pointer;
    }
  }
`;

const NodeWrapper = styled.div`
  margin-left: 27px;
  margin-top: 8px;
`;

const PopoverStyles = createGlobalStyle`
  .bp3-popover, .bp3-popover2 {
    box-shadow: none;
    border-radius: var(--ads-v2-border-radius);
    border: 1px solid var(--ads-v2-color-border);

    .bp3-popover2-content {
      border-radius: var(--ads-v2-border-radius);
    }
  }
`;

const StyledFormGroup = styled(FormGroup)`
  .styled-label {
    padding: 0 0 0.5rem;
  }

  .admin-settings-form-group-label {
    font-weight: var(--ads-v2-h5-font-weight);
  }
`;

type RadioGroupProps = SettingComponentProps;

function RadioFieldWrapper(
  componentProps: {
    meta: Partial<WrappedFieldMetaProps>;
    input: Partial<WrappedFieldInputProps>;
  } & RadioOptionProps,
) {
  function onChangeHandler(value: string) {
    setValue(value);
    componentProps.input.onChange &&
      componentProps.input.onChange({
        value,
        additionalData: componentProps.input.value.additionalData,
      });
  }

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <RadioGroup onChange={onChangeHandler as any} value={value}>
      <PopoverStyles />
      {componentProps.options.map((item) => {
        const isSelected = item.value === value;

        return (
          <div key={item.value}>
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
                    className="embed-settings-popover"
                    content={
                      <TooltipContent>
                        <Text
                          className="tooltip-text"
                          color="var(--ads-v2-color-fg)"
                          kind="action-m"
                          renderAs="p"
                        >
                          {item.tooltip.text}
                        </Text>
                        <Link
                          endIcon="arrow-right-line"
                          kind="primary"
                          target="_blank"
                          to={item.tooltip.link}
                        >
                          {item.tooltip.linkText}
                        </Link>
                      </TooltipContent>
                    }
                    interactionKind="hover"
                    position={Position.RIGHT}
                  >
                    <Icon className="icon" name={item.tooltip.icon} size="md" />
                  </Popover2>
                )}
              </SuffixWrapper>
            </Radio>
            {item.node && isSelected && item.nodeInputPath && (
              <NodeWrapper className={item.nodeParentClass}>
                <Text
                  color="var(--ads-v2-color-fg)"
                  kind="body-s"
                  renderAs="span"
                >
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
          </div>
        );
      })}
    </RadioGroup>
  );
}

export default function RadioField({ setting }: RadioGroupProps) {
  const controlTypeProps = setting.controlTypeProps as RadioOptionProps;

  return (
    <StyledFormGroup
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
    </StyledFormGroup>
  );
}
