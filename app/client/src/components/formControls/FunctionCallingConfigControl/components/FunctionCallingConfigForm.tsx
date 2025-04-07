import { Button, Text } from "@appsmith/ads";
import React, { useCallback, useState } from "react";
import type { FieldArrayFieldsProps } from "redux-form";
import styled from "styled-components";
import { v4 as uuid } from "uuid";
import type { FunctionCallingConfigFormToolField } from "../types";
import { FunctionCallingConfigToolField } from "./FunctionCallingConfigToolField";

export interface FunctionCallingConfigFormProps {
  formName: string;
  fields: FieldArrayFieldsProps<FunctionCallingConfigFormToolField>;
}

const Header = styled.div`
  display: flex;
  gap: var(--ads-v2-spaces-4);
  justify-content: space-between;
`;

const ConfigItems = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ads-v2-spaces-4);
  margin-top: var(--ads-v2-spaces-4);
`;

export const FunctionCallingConfigForm = ({
  fields,
  formName,
}: FunctionCallingConfigFormProps) => {
  const [newlyAddedId, setNewlyAddedId] = useState<string | null>(null);

  const handleAddFunctionButtonClick = useCallback(() => {
    const id = uuid();

    fields.push({
      id,
      description: "",
      entityId: "",
      isApprovalRequired: false,
      entityType: "Query",
    });
    setNewlyAddedId(id);
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
        <Text isBold kind="heading-s" renderAs="p">
          Function calls
        </Text>

        <Button
          UNSAFE_width="110px"
          kind="secondary"
          onClick={handleAddFunctionButtonClick}
          startIcon="plus"
        >
          Add Function
        </Button>
      </Header>

      {fields.length > 0 && (
        <ConfigItems>
          {fields.map((field, index) => {
            const fieldValue = fields.get(index);
            const isNewlyAdded = fieldValue.id === newlyAddedId;

            // Reset the newly added ID after rendering to ensure focus only happens once
            if (isNewlyAdded) {
              setTimeout(() => setNewlyAddedId(null), 100);
            }

            return (
              <div key={field}>
                <FunctionCallingConfigToolField
                  fieldPath={field}
                  formName={formName}
                  index={index}
                  isLastAdded={isNewlyAdded}
                  onRemove={handleRemoveToolButtonClick}
                />
              </div>
            );
          })}
        </ConfigItems>
      )}
    </>
  );
};
