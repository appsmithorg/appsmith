import React, { useEffect } from "react";
import FormControl from "pages/Editor/FormControl";
import { Text, TextType } from "design-system";
import Icon, { IconSize } from "components/ads/Icon";
import { Classes } from "components/ads/common";
import styled from "styled-components";
import { FieldArray } from "redux-form";
import { ControlProps } from "./BaseControl";

const CenteredIcon = styled(Icon)`
  margin-top: 26px;
  &.hide {
    opacity: 0;
    pointer-events: none;
  }
`;

const PrimaryBox = styled.div`
  display: flex;
  width: min-content;
  flex-direction: column;
  border: 2px solid ${(props) => props.theme.colors.apiPane.dividerBg};
  padding: 10px;
`;

const SecondaryBox = styled.div`
  display: flex;
  flex-direction: row;
  width: min-content;
  align-items: center;
  justify-content: space-between;
  padding: 5px;

  & > div {
    margin-right: 8px;
    height: 60px;
  }

  & > .t--form-control-QUERY_DYNAMIC_INPUT_TEXT > div {
    width: 20vw !important;
  }

  & > .t--form-control-DROP_DOWN,
  & > .t--form-control-DROP_DOWN > div > div,
  & > .t--form-control-DROP_DOWN > div > div > div > div {
    width: 12vw;
  }
`;

const AddMoreAction = styled.div`
  width: fit-content;
  cursor: pointer;
  display: flex;
  margin-top: 16px;
  .${Classes.TEXT} {
    margin-left: 8px;
    color: #03b365;
  }
`;
function NestedComponents(props: any) {
  useEffect(() => {
    if (props.fields.length < 1) {
      props.fields.push({ path: "", value: "" });
    }
  }, [props.fields.length]);
  return (
    <PrimaryBox>
      {props.fields &&
        props.fields.length > 0 &&
        props.fields.map((field: string, index: number) => {
          return (
            <SecondaryBox key={index}>
              {props.schema.map((sch: any, idx: number) => {
                sch = {
                  ...sch,
                  configProperty: `${field}.${sch.key}`,
                  customStyles: {
                    width: "20vw",
                    ...props.customStyles,
                  },
                };
                return (
                  <FormControl
                    config={sch}
                    formName={props.formName}
                    key={idx}
                  />
                );
              })}
              <CenteredIcon
                name="delete"
                onClick={(e) => {
                  e.stopPropagation();
                  props.fields.remove(index);
                }}
                size={IconSize.XXL}
              />
            </SecondaryBox>
          );
        })}
      <AddMoreAction onClick={() => props.fields.push({ path: "", value: "" })}>
        {/*Hardcoded label to be removed */}
        <Text type={TextType.H5}>+ Add Condition (And)</Text>
      </AddMoreAction>
    </PrimaryBox>
  );
}

export default function FieldArrayControl(props: FieldArrayControlProps) {
  const { configProperty, formName, schema } = props;
  return (
    <FieldArray
      component={NestedComponents}
      name={configProperty}
      props={{ formName, schema }}
      rerenderOnEveryChange={false}
    />
  );
}

export type FieldArrayControlProps = ControlProps;
