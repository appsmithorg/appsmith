import React, { useEffect } from "react";
import { FieldArray, WrappedFieldArrayProps } from "redux-form";
import styled from "styled-components";
import DynamicTextField from "./DynamicTextField";
import FormRow from "components/editorComponents/FormRow";
import FormLabel from "components/editorComponents/FormLabel";
import FIELD_VALUES from "constants/FieldExpectedValue";
import HelperTooltip from "components/editorComponents/HelperTooltip";
import Icon, { IconSize } from "components/ads/Icon";
import {
  CodeEditorBorder,
  EditorTheme,
} from "components/editorComponents/CodeEditor/EditorConfig";
import Text, { Case, TextType } from "components/ads/Text";
import { Classes } from "components/ads/common";

const KeyValueStackContainer = styled.div`
  padding: ${(props) => props.theme.spaces[4]}px
    ${(props) => props.theme.spaces[14]}px
    ${(props) => props.theme.spaces[11] + 1}px
    ${(props) => props.theme.spaces[11] + 2}px;
`;
const FormRowWithLabel = styled(FormRow)`
  flex-wrap: wrap;
  ${FormLabel} {
    width: 100%;
  }
  & svg {
    cursor: pointer;
  }
`;

const CenteredIcon = styled(Icon)`
  align-self: center;
  margin-left: 15px;
`;

const AddMoreAction = styled.div`
  width: fit-content;
  cursor: pointer;
  display: flex;
  margin-top: 16px;
  margin-left: 12px;
  .${Classes.TEXT} {
    margin-left: 8px;
    color: #858282;
  }
  svg path {
    stroke: ${(props) => props.theme.colors.apiPane.bg};
  }
`;

const Flex = styled.div<{ size: number }>`
  flex: ${(props) => props.size};
  ${(props) =>
    props.size === 3
      ? `
    margin-left: ${props.theme.spaces[4]}px;
  `
      : null};
`;

const FlexContainer = styled.div`
  display: flex;
  align-items: center;
  width: calc(100% - 30px);

  .key-value {
    padding: ${(props) => props.theme.spaces[2]}px 0px
      ${(props) => props.theme.spaces[2]}px
      ${(props) => props.theme.spaces[1]}px;
    .${Classes.TEXT} {
      color: ${(props) => props.theme.colors.apiPane.text};
    }
  }
  .key-value:nth-child(2) {
    margin-left: ${(props) => props.theme.spaces[4]}px;
  }
`;

const KeyValueRow = (props: Props & WrappedFieldArrayProps) => {
  useEffect(() => {
    // Always maintain 2 rows
    if (props.fields.length < 2 && props.pushFields) {
      for (let i = props.fields.length; i < 2; i += 1) {
        props.fields.push({ key: "", value: "" });
      }
    }
  }, [props.fields, props.pushFields]);

  return (
    <KeyValueStackContainer>
      <FlexContainer>
        <Flex size={1} className="key-value">
          <Text type={TextType.H6} case={Case.CAPITALIZE}>
            Key
          </Text>
        </Flex>
        <Flex size={3} className="key-value">
          <Text type={TextType.H6} case={Case.CAPITALIZE}>
            Value
          </Text>
        </Flex>
      </FlexContainer>
      {props.fields.length > 0 && (
        <React.Fragment>
          {props.fields.map((field: any, index: number) => {
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
                <Flex size={1}>
                  <DynamicTextField
                    theme={props.theme}
                    className={`t--${field}.key.${index}`}
                    name={`${field}.key`}
                    placeholder={`Key ${index + 1}`}
                    showLightningMenu={false}
                    dataTreePath={`${props.dataTreePath}[${index}].key`}
                    hoverInteraction={true}
                    border={CodeEditorBorder.BOTTOM_SIDE}
                  />
                </Flex>

                {!props.actionConfig && (
                  <Flex size={3}>
                    <DynamicTextField
                      theme={props.theme}
                      className={`t--${field}.value.${index}`}
                      name={`${field}.value`}
                      placeholder={`Value ${index + 1}`}
                      dataTreePath={`${props.dataTreePath}[${index}].value`}
                      expected={FIELD_VALUES.API_ACTION.params}
                      hoverInteraction={true}
                      border={CodeEditorBorder.BOTTOM_SIDE}
                    />
                  </Flex>
                )}

                {props.actionConfig && props.actionConfig[index] && (
                  <Flex size={3}>
                    <DynamicTextField
                      theme={props.theme}
                      className={`t--${field}.value.${index}`}
                      name={`${field}.value`}
                      dataTreePath={`${props.dataTreePath}[${index}].value`}
                      expected={FIELD_VALUES.API_ACTION.params}
                      placeholder={
                        props.placeholder
                          ? `${props.placeholder} ${index + 1}`
                          : props.actionConfig[index].mandatory &&
                            props.actionConfig[index].type
                          ? `${props.actionConfig[index].type}`
                          : props.actionConfig[index].type
                          ? `${props.actionConfig[index].type} (Optional)`
                          : `(Optional)`
                      }
                      disabled={
                        !(
                          props.actionConfig[index].editable ||
                          props.actionConfig[index].editable === undefined
                        )
                      }
                      showLightningMenu={
                        props.actionConfig[index].editable ||
                        props.actionConfig[index].editable === undefined
                      }
                      {...otherProps}
                      hoverInteraction={true}
                      border={CodeEditorBorder.BOTTOM_SIDE}
                    />
                  </Flex>
                )}
                {props.addOrDeleteFields !== false && (
                  <CenteredIcon
                    name="delete"
                    size={IconSize.LARGE}
                    onClick={() => props.fields.remove(index)}
                  />
                )}
              </FormRowWithLabel>
            );
          })}
        </React.Fragment>
      )}
      <AddMoreAction onClick={() => props.fields.push({ key: "", value: "" })}>
        <Icon
          name="add-more"
          className="t--addApiHeader"
          size={IconSize.LARGE}
        />
        <Text type={TextType.H5} case={Case.UPPERCASE}>
          Add more
        </Text>
      </AddMoreAction>
    </KeyValueStackContainer>
  );
};

type Props = {
  name: string;
  label: string;
  // TODO(Hetu): Fix the banned type here
  // eslint-disable-next-line @typescript-eslint/ban-types
  rightIcon?: Function;
  description?: string;
  actionConfig?: any;
  addOrDeleteFields?: boolean;
  mandatory?: boolean;
  type?: string;
  placeholder?: string;
  pushFields?: boolean;
  dataTreePath?: string;
  theme?: EditorTheme;
};

const KeyValueFieldArray = (props: Props) => {
  return (
    <FieldArray
      component={KeyValueRow}
      rerenderOnEveryChange={false}
      {...props}
    />
  );
};

export default KeyValueFieldArray;
