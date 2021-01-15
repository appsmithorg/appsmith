import React, { useEffect, useState } from "react";
import { FieldArray, WrappedFieldArrayProps } from "redux-form";
import styled from "styled-components";
import DynamicTextField from "./DynamicTextField";
import FormRow from "components/editorComponents/FormRow";
import FormLabel from "components/editorComponents/FormLabel";
import FIELD_VALUES from "constants/FieldExpectedValue";
import HelperTooltip from "components/editorComponents/HelperTooltip";
import Icon, { IconSize } from "components/ads/Icon";
import {
  EditorSize,
  EditorTheme,
  TabBehaviour,
  CodeEditorBorder,
} from "components/editorComponents/CodeEditor/EditorConfig";
import Text, { Case, TextType } from "components/ads/Text";
import { Classes } from "components/ads/common";

const FormRowWithLabel = styled(FormRow)`
  flex-wrap: wrap;
  ${FormLabel} {
    width: 100%;
  }
  & svg {
    cursor: pointer;
  }
`;

const CenterdIcon = styled(Icon)`
  align-self: center;
  margin-left: 15px;
`;

const MoreAction = styled.div`
  cursor: pointer;
  display: flex;
  justify-content: flex-end;
  .${Classes.TEXT} {
    margin-left: 8px;
    color: #858282;
  }
  svg path {
    stroke: ${(props) => props.theme.colors.apiPane.bg};
  }
`;

const BottomWrapper = styled.div<{ bulkEdit: boolean }>`
  display: flex;
  justify-content: ${(props) =>
    !props.bulkEdit ? "space-between" : "flex-end"};
  align-items: center;
  position: absolute;
  bottom: 0px;
  right: 0px;
  height: 40px;
  width: 100%;
  padding: 0px ${(props) => props.theme.spaces[14]}px 0px
    ${(props) => props.theme.spaces[9]}px;
`;

const KeyValueRow = (props: Props & WrappedFieldArrayProps) => {
  const [bulkEdit, setBulkEdit] = useState<boolean>(false);
  useEffect(() => {
    // Always maintain 2 rows
    if (props.fields.length < 2 && props.pushFields) {
      for (let i = props.fields.length; i < 2; i += 1) {
        props.fields.push({ key: "", value: "" });
      }
    }
  }, [props.fields, props.pushFields]);

  return (
    <React.Fragment>
      {props.fields.length && (
        <React.Fragment>
          {!bulkEdit &&
            props.fields.map((field: any, index: number) => {
              const otherProps: Record<string, any> = {};
              if (
                props.actionConfig &&
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
                  <div style={{ flex: 1 }}>
                    <DynamicTextField
                      theme={props.theme}
                      className={`t--${field}.value.${index}`}
                      name={`${field}.value`}
                      placeholder="Value"
                      dataTreePath={`${props.dataTreePath}[${index}].value`}
                      expected={FIELD_VALUES.API_ACTION.params}
                      hoverInteraction={true}
                      border={CodeEditorBorder.BOTTOM_SIDE}
                    />
                  </div>

                  {!props.actionConfig && (
                    <div style={{ flex: 3 }}>
                      <DynamicTextField
                        theme={props.theme}
                        className={`t--${field}.value.${index}`}
                        name={`${field}.value`}
                        placeholder="Value"
                        dataTreePath={`${props.dataTreePath}[${index}].value`}
                        expected={FIELD_VALUES.API_ACTION.params}
                        hoverInteraction={true}
                        border={CodeEditorBorder.BOTTOM_SIDE}
                      />
                    </div>
                  )}

                  {props.actionConfig && props.actionConfig[index] && (
                    <div style={{ flex: 3 }}>
                      <DynamicTextField
                        theme={props.theme}
                        className={`t--${field}.value.${index}`}
                        name={`${field}.value`}
                        dataTreePath={`${props.dataTreePath}[${index}].value`}
                        expected={FIELD_VALUES.API_ACTION.params}
                        placeholder={
                          props.placeholder
                            ? props.placeholder
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
                          !!(
                            props.actionConfig[index].editable ||
                            props.actionConfig[index].editable === undefined
                          )
                        }
                        {...otherProps}
                        hoverInteraction={true}
                        border={CodeEditorBorder.BOTTOM_SIDE}
                      />
                    </div>
                  )}
                  {props.addOrDeleteFields !== false && (
                    <CenterdIcon
                      name="delete"
                      size={IconSize.LARGE}
                      onClick={() => props.fields.remove(index)}
                    />
                  )}
                </FormRowWithLabel>
              );
            })}

          {bulkEdit && (
            <DynamicTextField
              name={props.fields.name}
              tabBehaviour={TabBehaviour.INDENT}
              size={EditorSize.EXTENDED}
              placeholder={"bulk edit"}
              dataTreePath={props.dataTreePath}
              theme={props.theme}
              expected={FIELD_VALUES.API_ACTION.headers}
            />
          )}
          <BottomWrapper bulkEdit={bulkEdit}>
            {!bulkEdit ? (
              <>
                <MoreAction
                  onClick={() => props.fields.push({ key: "", value: "" })}
                >
                  <Icon
                    name="add-more"
                    className="t--addApiHeader"
                    size={IconSize.LARGE}
                  />
                  <Text type={TextType.H6} case={Case.UPPERCASE}>
                    Add more
                  </Text>
                </MoreAction>
                <MoreAction onClick={() => setBulkEdit(true)}>
                  <Icon
                    name="edit"
                    className="t--bulkEditHeader"
                    size={IconSize.LARGE}
                  />
                  <Text type={TextType.H6} case={Case.UPPERCASE}>
                    Bulk edit
                  </Text>
                </MoreAction>
              </>
            ) : (
              <MoreAction onClick={() => setBulkEdit(false)}>
                <Icon
                  name="edit"
                  className="t--bulkEditHeader"
                  size={IconSize.LARGE}
                />
                <Text type={TextType.H6} case={Case.UPPERCASE}>
                  Key-Value Edit
                </Text>
              </MoreAction>
            )}
          </BottomWrapper>
        </React.Fragment>
      )}
    </React.Fragment>
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
