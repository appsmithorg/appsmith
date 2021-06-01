import React, { useEffect } from "react";
import FormControl from "pages/Editor/FormControl";
import Text, { TextType, Case } from "components/ads/Text";
import Icon, { IconSize } from "components/ads/Icon";
import { Classes } from "components/ads/common";
import styled from "styled-components";
import { FieldArray } from "redux-form";
import FormLabel from "components/editorComponents/FormLabel";
import { ControlProps } from "./BaseControl";

const CenteredIcon = styled(Icon)`
  margin-top: 25px;
  &.hide {
    opacity: 0;
    pointer-events: none;
  }
`;

const PrimaryBox = styled.div`
  display: flex;
  flex-direction: column;
  border: 2px solid ${(props) => props.theme.colors.apiPane.dividerBg};
  padding: 10px;
  border-radius: 5px;
`;

const SecondaryBox = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 5px;
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
      props.fields.push({ key: "", operand: "", value: "" });
    }
  }, [props.fields.length]);
  return (
    props.fields &&
    props.fields.length > 0 && (
      <PrimaryBox>
        {props.fields.map((field: string, index: number) => {
          return (
            <SecondaryBox key={index}>
              {props.schema.map((sch: any, idx: number) => {
                sch = {
                  ...sch,
                  configProperty: `${field}.${sch.key}`,
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
                className={index === 0 ? "hide" : ""}
                name="delete"
                onClick={() => index > 0 && props.fields.remove(index)}
                size={IconSize.XXL}
              />
            </SecondaryBox>
          );
        })}
        <AddMoreAction
          onClick={() => props.fields.push({ key: "", value: "", operand: "" })}
        >
          {/*Hardcoded label to be removed */}
          <Text type={TextType.H5}>+ Add Condition (And)</Text>
        </AddMoreAction>
      </PrimaryBox>
    )
  );
}

export default function FieldArrayControl(props: FieldArrayControlProps) {
  const { configProperty, formName, label, schema } = props;
  return (
    <>
      <FormLabel>{label}</FormLabel>
      <FieldArray
        component={NestedComponents}
        name={configProperty}
        props={{ formName, schema }}
        rerenderOnEveryChange={false}
      />
    </>
  );
}

export type FieldArrayControlProps = ControlProps;
