import React, { useCallback } from "react";
import FormControl from "pages/Editor/FormControl";
import styled from "styled-components";
import { FieldArray } from "redux-form";
import type { ControlProps } from "./BaseControl";
import { Button } from "@appsmith/ads";

const CenteredIconButton = styled(Button)<{
  alignSelf?: string;
  top?: string;
}>`
  position: relative;
  align-self: ${(props) => (props.alignSelf ? props.alignSelf : "center")};
  top: ${(props) => (props.top ? props.top : "0px")};
`;

const PrimaryBox = styled.div`
  display: flex;
  width: min-content;
  flex-direction: column;
  padding: 10px 0px 0px 0px;

  > div:not(:first-child) .form-config-top {
    display: none;
  }
`;

const SecondaryBox = styled.div`
  display: flex;
  flex-direction: row;
  width: min-content;
  align-items: center;
  justify-content: space-between;

  & > div {
    margin-right: 8px;
    margin-bottom: 8px;
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
  cursor: pointer;
  width: max-content;
`;

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function NestedComponents(props: any) {
  const addMore = useCallback(() => {
    const { schema = {} } = props;
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const newObject: any = {};

    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    schema.forEach((s: any) => {
      newObject[s.key] = s.initialValue || "";
    });

    props.fields.push(newObject);
  }, [props.fields]);

  return (
    <PrimaryBox>
      {props.fields &&
        props.fields.length > 0 &&
        props.fields.map((field: string, index: number) => {
          return (
            <SecondaryBox className="array-control-secondary-box" key={index}>
              {/* TODO: Fix this the next time the file is edited */}
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {props.schema.map((sch: any, idx: number) => {
                sch = {
                  ...sch,
                  configProperty: `${field}.${sch.key}`,
                  customStyles: {
                    width: "20vw",
                    ...(props.customStyles ?? {}),
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
              <CenteredIconButton
                alignSelf={"start"}
                data-testid={`t--where-clause-delete-[${index}]`}
                isIconButton
                kind="tertiary"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  props.fields.remove(index);
                }}
                size="md"
                startIcon="close"
                top={index === 0 ? "20px" : ""}
              />
            </SecondaryBox>
          );
        })}
      <AddMoreAction>
        <Button
          className={`t--where-add-condition[${props?.currentNestingLevel}]`}
          kind="tertiary"
          onClick={addMore}
          size="md"
          startIcon="add-more"
        >
          {props.addMoreButtonLabel}
        </Button>
      </AddMoreAction>
    </PrimaryBox>
  );
}

export default function FieldArrayControl(props: FieldArrayControlProps) {
  const {
    addMoreButtonLabel = "+ Add Condition (And)",
    configProperty,
    customStyles = {},
    formName,
    schema,
  } = props;
  return (
    <FieldArray
      component={NestedComponents}
      name={configProperty}
      props={{
        formName,
        schema,
        addMoreButtonLabel,
        configProperty,
        customStyles,
      }}
      rerenderOnEveryChange={false}
    />
  );
}

export type FieldArrayControlProps = ControlProps;
