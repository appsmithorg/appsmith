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

const valueFieldConfig: any = {
  // label: "Value",
  key: "value",
  controlType: "QUERY_DYNAMIC_INPUT_TEXT",
  placeholderText: "value",
};

const keyFieldConfig: any = {
  // label: "Key",
  key: "key",
  controlType: "QUERY_DYNAMIC_INPUT_TEXT",
  placeholderText: "key",
};

const conditionFieldConfig: any = {
  // label: "Operator",
  key: "operator",
  controlType: "DROP_DOWN",
  initialValue: "EQ",
  options: [],
};

const logicalFieldConfig: any = {
  label: "Operator",
  key: "logicalType",
  controlType: "DROP_DOWN",
  initialValue: "EQ",
  options: [],
  customStyles: { width: "10vh", height: "30px" },
};

const CenteredIcon = styled(Icon)`
  /* margin-top: 25px; */
  margin-left: 5px;
  align-self: end;
  margin-bottom: 10px;
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
  const customStyles = {
    width: `${(props.maxWidth - 15) / 3}vh`,
    height: "30px",
  };

  let keyLabel = "";
  let valueLabel = "";
  let conditionLabel = "";
  if (index === 0) {
    keyLabel = "Key";
    valueLabel = "Value";
    conditionLabel = "Operator";
  }
  return (
    <ConditionBox key={index}>
      <FormControl
        config={{
          ...keyFieldConfig,
          label: keyLabel,
          customStyles,
          configProperty: `${props.field}.key`,
        }}
        formName={props.formName}
      />
      <FormControl
        config={{
          ...conditionFieldConfig,
          label: conditionLabel,
          customStyles,
          configProperty: `${props.field}.condition`,
          options: props.comparisonTypes,
          initialValue: props.comparisonTypes[0],
        }}
        formName={props.formName}
      />
      <FormControl
        config={{
          ...valueFieldConfig,
          label: valueLabel,
          customStyles,
          configProperty: `${props.field}.value`,
        }}
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
      if (props.currentNestingLevel === 0) {
        props.fields.push({});
      } else {
        props.onDeletePressed(props.index);
      }
    }
  }, [props.fields.length]);
  const onDeletePressed = (index: number) => {
    props.fields.remove(index);
  };
  // eslint-disable-next-line no-console
  // console.log("Ayush checking fields", props.fields);
  return (
    <PrimaryBox style={{ width: `${props.maxWidth}vh` }}>
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
              if (
                !!fieldValue &&
                ("logicalType" in fieldValue || "children" in fieldValue)
              ) {
                // eslint-disable-next-line no-console
                console.log(
                  "Ayush checking for special child",
                  fieldValue,
                  props,
                  field,
                );
                return (
                  <ConditionBox>
                    <FieldArray
                      component={NestedComponents}
                      key={`${field}.children`}
                      name={`${field}.children`}
                      props={{
                        maxWidth: props.maxWidth - 15,
                        configProperty: `${field}`,
                        formName: props.formName,
                        logicalTypes: props.logicalTypes,
                        comparisonKeys: props.comparisonKeys,
                        comparisonTypes: props.comparisonTypes,
                        nestedLevels: props.nestedLevels,
                        currentNestingLevel: props.currentNestingLevel + 1,
                        onDeletePressed,
                        index,
                      }}
                      rerenderOnEveryChange={false}
                    />
                    <CenteredIcon
                      name="cross"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeletePressed(index);
                      }}
                      size={IconSize.SMALL}
                    />
                  </ConditionBox>
                );
              } else {
                return ConditionComponent(
                  {
                    onDeletePressed,
                    field,
                    formName: props.formName,
                    comparisonTypes: props.comparisonTypes,
                    maxWidth: props.maxWidth,
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
              props.fields.push({
                logicalType: props.logicalTypes[0].value,
                children: [{}],
              });
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
  const maxWidth = 105;
  return (
    <>
      <FormLabel>{label}</FormLabel>
      <FieldArray
        component={NestedComponents}
        key={`${configProperty}.children`}
        name={`${configProperty}.children`}
        props={{
          configProperty,
          maxWidth,
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
