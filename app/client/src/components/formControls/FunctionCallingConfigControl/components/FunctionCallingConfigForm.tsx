import { Button, Text } from "@appsmith/ads";
import { default as React, useCallback } from "react";
import type { FieldArrayFieldsProps } from "redux-form";
import styled from "styled-components";
import { v4 as uuid } from "uuid";
import type { FunctionCallingConfigFormToolField } from "../types";
import { FunctionCallingConfigToolField } from "./FunctionCallingConfigToolField";
import { FunctionCallingEmpty } from "./FunctionCallingEmpty";

export interface FunctionCallingConfigFormProps {
  formName: string;
  fields: FieldArrayFieldsProps<FunctionCallingConfigFormToolField>;
}

const Header = styled.div`
  display: flex;
  gap: var(--ads-v2-spaces-4);
  justify-content: space-between;
  margin-bottom: var(--ads-v2-spaces-4);
`;

const ConfigItems = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ads-v2-spaces-4);
`;

export const FunctionCallingConfigForm = ({
  fields,
  formName,
}: FunctionCallingConfigFormProps) => {
  const handleAddFunctionButtonClick = useCallback(() => {
    fields.push({
      id: uuid(),
      description: "",
      entityId: "",
      isApprovalRequired: false,
      entityType: "Query",
    });
  }, [fields]);

  const handleRemoveToolButtonClick = useCallback(
    (index: number) => {
      fields.remove(index);
    },
    [fields],
  );

  return (
    <>
      <Header>
        <div>
          <Text isBold kind="heading-s" renderAs="p">
            Function Calls
          </Text>
          <Text renderAs="p">
            Add functions for the model to execute dynamically.
          </Text>
        </div>

        <Button
          kind="secondary"
          onClick={handleAddFunctionButtonClick}
          startIcon="plus"
        >
          Add Function
        </Button>
      </Header>

      {fields.length === 0 ? (
        <FunctionCallingEmpty />
      ) : (
        <ConfigItems>
          {fields.map((field, index) => {
            return (
              <FunctionCallingConfigToolField
                fieldPath={field}
                formName={formName}
                index={index}
                key={field}
                onRemove={handleRemoveToolButtonClick}
              />
            );
          })}
        </ConfigItems>
      )}
    </>
  );
};
