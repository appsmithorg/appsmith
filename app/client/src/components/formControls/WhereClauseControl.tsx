import React, { useEffect } from "react";
import FormControl from "pages/Editor/FormControl";
import Text, { TextType } from "components/ads/Text";
import Icon, { IconSize } from "components/ads/Icon";
import { Classes } from "components/ads/common";
import styled from "styled-components";
import { FieldArray } from "redux-form";
import FormLabel from "components/editorComponents/FormLabel";
import { ControlProps } from "./BaseControl";

export type conditionBlock = {
  key: string;
  value: string;
  condition: string;
};

export type whereClauseValueType = {
  logicalType: string;
  children: [conditionBlock | whereClauseValueType];
};

const customStyles = { width: "30vh", height: "30px" };

const valueFieldConfig: any = {
  // label: "Value",
  key: "value",
  controlType: "QUERY_DYNAMIC_INPUT_TEXT",
  placeholderText: "value",
  customStyles,
};

const keyFieldConfig: any = {
  // label: "Key",
  key: "key",
  controlType: "QUERY_DYNAMIC_INPUT_TEXT",
  placeholderText: "key",
  customStyles,
};

const conditionFieldConfig: any = {
  // label: "Operator",
  key: "operator",
  controlType: "DROP_DOWN",
  initialValue: "EQ",
  options: [],
  customStyles,
};

const logicalFieldConfig: any = {
  // label: "Operator",
  key: "logicalType",
  controlType: "DROP_DOWN",
  initialValue: "EQ",
  options: [],
  customStyles: { width: "10vh", height: "30px" },
};

const INIT_CONDITION_BLOCK = {
  logicalType: "OR",
  children: [{}],
};

const CenteredIcon = styled(Icon)`
  /* margin-top: 25px; */
  margin-left: 5px;
  &.hide {
    opacity: 0;
    pointer-events: none;
  }
`;

const PrimaryBox = styled.div`
  display: flex;
  width: 105vh;
  flex-direction: column;
  border: 2px solid ${(props) => props.theme.colors.apiPane.dividerBg};
  padding: 10px;
  border-radius: 5px;
`;

const SecondaryBox = styled.div`
  display: flex;
  flex-direction: row;
`;

const ConditionWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: min-content;
  /* align-items: center; */
  justify-content: space-between;
  /* padding: 5px; */
`;

const ConditionBox = styled.div`
  display: flex;
  flex-direction: row;
  width: min-content;
  /* align-items: center; */
  justify-content: space-between;
  /* padding: 5px; */
`;

const ActionBox = styled.div`
  display: flex;
  margin-top: 16px;
  flex-direction: row;
  width: max-content;
  /* align-items: center; */
  justify-content: space-between;
  /* padding: 5px; */
`;

const AddMoreAction = styled.div`
  /* width: fit-content; */
  cursor: pointer;
  .${Classes.TEXT} {
    margin-left: 8px;
    color: #03b365;
  }
`;

function ConditionComponent(props: any, index: number) {
  return (
    <ConditionBox key={index}>
      <FormControl
        config={{ ...keyFieldConfig, configProperty: `${props.field}.key` }}
        formName={props.formName}
      />
      <FormControl
        config={{
          ...conditionFieldConfig,
          configProperty: `${props.field}.condition`,
          options: props.comparisonTypes,
          initialValue: props.comparisonTypes[0],
        }}
        formName={props.formName}
      />
      <FormControl
        config={{ ...valueFieldConfig, configProperty: `${props.field}.value` }}
        formName={props.formName}
      />
      <CenteredIcon
        name="cross"
        onClick={(e) => {
          e.stopPropagation();
          props.onDeletePressed(index);
        }}
        size={IconSize.SMALL}
      />
    </ConditionBox>
  );
}

function NestedComponents(props: any) {
  useEffect(() => {
    if (props.fields.length < 1) {
      props.fields.push({});
    }
  }, [props.fields.length]);
  const onDeletePressed = (index: number) => {
    props.fields.remove(index);
  };
  // eslint-disable-next-line no-console
  // console.log("Ayush checking fields", props.fields);
  return (
    <PrimaryBox>
      <SecondaryBox>
        <FormControl
          config={{
            ...logicalFieldConfig,
            configProperty: `${props.configProperty}.logicalType`,
            options: props.logicalTypes,
            initialValue: props.logicalTypes[0],
          }}
          formName={props.formName}
        />
        <ConditionWrapper>
          {props.fields &&
            props.fields.length > 0 &&
            props.fields.map((field: any, index: number) => {
              // eslint-disable-next-line no-console
              // console.log("Ayush checking children of fields", field);
              const fieldValue = props.fields.get(index);
              if (!!fieldValue && "logicalType" in fieldValue) {
                // eslint-disable-next-line no-console
                console.log(
                  "Ayush checking for special child",
                  fieldValue,
                  props,
                );
                return (
                  <p>asasas</p>
                  // <FieldArray
                  //   component={NestedComponents}
                  //   name={`${props.configProperty}[${index}]`}
                  //   props={{
                  //     ...props,
                  //     currentNestingLevel: props.currentNestingLevel + 1,
                  //   }}
                  //   rerenderOnEveryChange={false}
                  // />
                );
              } else {
                return ConditionComponent(
                  {
                    onDeletePressed,
                    field,
                    formName: props.formName,
                    comparisonTypes: props.comparisonTypes,
                  },
                  index,
                );
              }
            })}
        </ConditionWrapper>
      </SecondaryBox>
      <ActionBox>
        <AddMoreAction onClick={() => props.fields.push({})}>
          {/*Hardcoded label to be removed */}
          <Text type={TextType.H5}>+ Add Filter</Text>
        </AddMoreAction>
        {props.currentNestingLevel < props.nestedLevels && (
          <AddMoreAction
            onClick={() => {
              props.fields.push(Object.assign({}, INIT_CONDITION_BLOCK));
              // eslint-disable-next-line no-console
              console.log("Ayush new field", props.fields.getAll());
            }}
          >
            {/*Hardcoded label to be removed */}
            <Text type={TextType.H5}>+ Add Filter Group</Text>
          </AddMoreAction>
        )}
      </ActionBox>
    </PrimaryBox>
  );
}

export default function WhereClauseControl(props: WhereClauseControlProps) {
  const {
    comparisonKeys,
    comparisonTypes,
    configProperty,
    formName,
    label,
    logicalTypes,
    nestedLevels,
  } = props;
  return (
    <>
      <FormLabel>{label}</FormLabel>
      <FieldArray
        component={NestedComponents}
        name={`${configProperty}.children`}
        props={{
          configProperty,
          formName,
          logicalTypes,
          comparisonKeys,
          comparisonTypes,
          nestedLevels,
          currentNestingLevel: 0,
        }}
        rerenderOnEveryChange={false}
      />
    </>
  );
}

export type WhereClauseControlProps = ControlProps;
