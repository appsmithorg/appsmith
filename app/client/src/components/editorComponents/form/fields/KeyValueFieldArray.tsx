import React, { useEffect } from "react";
import type { WrappedFieldArrayProps } from "redux-form";
import { FieldArray } from "redux-form";
import styled from "styled-components";
import DynamicTextField from "./DynamicTextField";
import FormRow from "components/editorComponents/FormRow";
import FormLabel from "components/editorComponents/FormLabel";
import FIELD_VALUES from "constants/FieldExpectedValue";
import HelperTooltip from "components/editorComponents/HelperTooltip";
import type { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import {
  CodeEditorBorder,
  EditorSize,
} from "components/editorComponents/CodeEditor/EditorConfig";
import { Classes } from "@appsmith/ads-old";
import { AutocompleteDataType } from "utils/autocomplete/AutocompleteDataType";
import {
  DEFAULT_MULTI_PART_DROPDOWN_PLACEHOLDER,
  MULTI_PART_DROPDOWN_OPTIONS,
} from "PluginActionEditor/constants/CommonApiConstants";
import { Button, Text } from "@appsmith/ads";
import RequestDropdownField from "./RequestDropdownField";

interface CustomStack {
  removeTopPadding?: boolean;
}

const KeyValueStackContainer = styled.div<CustomStack>`
  padding: 0 0 var(--ads-v2-spaces-7) 0;
`;
// const AddMoreButton = styled(Button)`
//   margin-top: 5px;
// `;
const FormRowWithLabel = styled(FormRow)`
  flex-wrap: wrap;
  margin-bottom: var(--ads-v2-spaces-3);
  ${FormLabel} {
    width: 100%;
  }
  & svg {
    cursor: pointer;
  }
`;

const CenteredButton = styled(Button)`
  align-self: center;
  margin-left: 5px;
`;

const Flex = styled.div<{ size: number }>`
  flex: ${(props) => props.size};
  ${(props) =>
    props.size === 3
      ? `
    margin-left: var(--ads-v2-spaces-3);
  `
      : null};
`;

const FlexContainer = styled.div`
  display: flex;
  align-items: center;
  width: calc(100% - 30px);

  .key-value {
    padding: 6px 0px 6px 0px;
    .${Classes.TEXT} {
      color: var(--ads-v2-color-fg);
    }
    border-bottom: 0px;
  }
  .key-value:nth-child(2) {
    margin-left: 0;
  }
`;

const DynamicTextFieldWithDropdownWrapper = styled.div`
  display: flex;
  position: relative;
`;

const DynamicDropdownFieldWrapper = styled.div`
  position: relative;
  margin-left: var(--ads-v2-spaces-3);
  border-color: var(--ads-v2-color-border);
  color: var(--ads-v2-color-fg);

  .ads-v2-select > .rc-select-selector {
    min-width: 77px;
    width: 77px;
    height: 36px;
  }
`;

const expected = {
  type: FIELD_VALUES.API_ACTION.params,
  example: "string",
  autocompleteDataType: AutocompleteDataType.STRING,
};

function KeyValueRow(props: Props & WrappedFieldArrayProps) {
  useEffect(() => {
    const allProps = props.fields?.getAll();

    if (!!allProps) {
      if (props.fields.length < 2 && props.pushFields) {
        for (let i = props.fields.length; i < 2; i += 1) {
          props.fields.push({ key: "", value: "" });
        }
      }
    }
  }, [props.fields, props.pushFields]);

  return (
    <KeyValueStackContainer
      removeTopPadding={props.hideHeader || props.removeTopPadding}
    >
      {!props.hideHeader && (
        <FlexContainer>
          <Flex className="key-value" size={props.hasType ? 2 : 1}>
            <Text kind="body-m">Key</Text>
          </Flex>
          <Flex className="key-value" size={3}>
            <Text kind="body-m">Value</Text>
          </Flex>
        </FlexContainer>
      )}
      {props.fields.length > 0 && (
        <>
          {/* TODO: Fix this the next time the file is edited */}
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {props.fields.map((field: any, index: number) => {
            // TODO: Fix this the next time the file is edited
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const otherProps: Record<string, any> = {};

            if (
              props.actionConfig &&
              props.actionConfig[index] &&
              props.actionConfig[index].description &&
              props.rightIcon
            ) {
              otherProps.rightIcon = (
                <HelperTooltip
                  description={props.actionConfig[index].description}
                  rightIcon={props.rightIcon}
                />
              );
            }

            return (
              <FormRowWithLabel key={index}>
                <Flex
                  data-location-id={btoa(`${field}.key`)}
                  size={props.hasType ? 2 : 1}
                >
                  {props.hasType ? (
                    <DynamicTextFieldWithDropdownWrapper>
                      <DynamicTextField
                        border={CodeEditorBorder.ALL_SIDE}
                        className={`t--${field}.key.${index}`}
                        dataTreePath={`${props.dataTreePath}[${index}].key`}
                        evaluatedPopUpLabel={"Key"}
                        expected={expected}
                        hoverInteraction
                        name={`${field}.key`}
                        placeholder={`Key ${index + 1}`}
                        size={EditorSize.COMPACT_RETAIN_FORMATTING}
                        theme={props.theme}
                      />

                      <DynamicDropdownFieldWrapper
                        data-location-id={btoa(`${field}.type`)}
                      >
                        {/* eslint-disable-next-line */}
                        {/* @ts-ignore*/}
                        <RequestDropdownField
                          name={`${field}.type`}
                          options={MULTI_PART_DROPDOWN_OPTIONS}
                          placeholder={DEFAULT_MULTI_PART_DROPDOWN_PLACEHOLDER}
                        />
                      </DynamicDropdownFieldWrapper>
                    </DynamicTextFieldWithDropdownWrapper>
                  ) : (
                    <DynamicTextField
                      border={CodeEditorBorder.ALL_SIDE}
                      className={`t--${field}.key.${index}`}
                      dataTreePath={`${props.dataTreePath}[${index}].key`}
                      evaluatedPopUpLabel={"Key"}
                      expected={expected}
                      hoverInteraction
                      name={`${field}.key`}
                      placeholder={`Key ${index + 1}`}
                      size={EditorSize.COMPACT_RETAIN_FORMATTING}
                      theme={props.theme}
                    />
                  )}
                </Flex>

                {!props.actionConfig && (
                  <Flex data-location-id={btoa(`${field}.value`)} size={3}>
                    <DynamicTextField
                      border={CodeEditorBorder.ALL_SIDE}
                      className={`t--${field}.value.${index}`}
                      dataTreePath={`${props.dataTreePath}[${index}].value`}
                      evaluatedPopUpLabel={"Value"}
                      expected={expected}
                      hoverInteraction
                      name={`${field}.value`}
                      placeholder={`Value ${index + 1}`}
                      size={EditorSize.COMPACT_RETAIN_FORMATTING}
                      theme={props.theme}
                    />
                  </Flex>
                )}

                {props.actionConfig && props.actionConfig[index] && (
                  <Flex data-location-id={btoa(`${field}.value`)} size={3}>
                    <DynamicTextField
                      className={`t--${field}.value.${index}`}
                      dataTreePath={`${props.dataTreePath}[${index}].value`}
                      disabled={
                        !(
                          props.actionConfig[index].editable ||
                          props.actionConfig[index].editable === undefined
                        )
                      }
                      evaluatedPopUpLabel={"Value"}
                      expected={expected}
                      name={`${field}.value`}
                      placeholder={
                        props.placeholder
                          ? `${props.placeholder} ${index + 1}`
                          : props.actionConfig[index].mandatory &&
                              props.actionConfig[index].type
                            ? `${props.actionConfig[index].type}`
                            : props.actionConfig[index].type
                              ? `${props.actionConfig[index].type} (optional)`
                              : `(optional)`
                      }
                      showLightningMenu={
                        props.actionConfig[index].editable ||
                        props.actionConfig[index].editable === undefined
                      }
                      size={EditorSize.COMPACT_RETAIN_FORMATTING}
                      theme={props.theme}
                      {...otherProps}
                      border={CodeEditorBorder.ALL_SIDE}
                      hoverInteraction
                    />
                  </Flex>
                )}
                {props.addOrDeleteFields !== false && (
                  <CenteredButton
                    data-testid="t--trash-icon"
                    isIconButton
                    kind="tertiary"
                    onClick={() => props.fields.remove(index)}
                    size="md"
                    startIcon="delete-bin-line"
                  />
                )}
              </FormRowWithLabel>
            );
          })}
        </>
      )}
      <Button
        className="btn-add-more t--addApiHeader"
        kind="tertiary"
        onClick={() => props.fields.push({ key: "", value: "" })}
        size="md"
        startIcon="add-more"
      >
        Add more
      </Button>
    </KeyValueStackContainer>
  );
}

interface Props {
  name: string;
  label: string;
  rightIcon?: React.ReactNode;
  description?: string;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  actionConfig?: any;
  addOrDeleteFields?: boolean;
  mandatory?: boolean;
  type?: string;
  placeholder?: string;
  pushFields?: boolean;
  dataTreePath?: string;
  hideHeader?: boolean;
  theme?: EditorTheme;
  hasType?: boolean;
  removeTopPadding?: boolean;
}

function KeyValueFieldArray(props: Props) {
  return (
    <FieldArray
      component={KeyValueRow}
      rerenderOnEveryChange={false}
      {...props}
    />
  );
}

export default KeyValueFieldArray;
