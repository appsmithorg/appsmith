import { Button, Text } from "@appsmith/ads";
import { default as React, useCallback, useRef, useEffect } from "react";
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
  const latestFieldRef = useRef<HTMLDivElement>(null);
  const previousFieldsLength = useRef(fields.length);

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

  useEffect(
    function handleAddFunction() {
      // Only scroll and focus if a new field was added (length increased)
      if (
        fields.length > previousFieldsLength.current &&
        latestFieldRef.current
      ) {
        // Scroll the new field into view
        latestFieldRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });

        // Focus the menu button in the latest field
        // The menu button is rendered by the Menu component from @appsmith/ads
        const menuButton = latestFieldRef.current.querySelector(
          "button.rc-select-selector",
        );

        if (menuButton) {
          // Use setTimeout to ensure the button is fully rendered
          setTimeout(() => {
            (menuButton as HTMLButtonElement).focus();
          }, 100);
        }
      }

      previousFieldsLength.current = fields.length;
    },
    [fields.length],
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
          UNSAFE_width="110px"
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
            const isLastField = index === fields.length - 1;

            return (
              <div key={field} ref={isLastField ? latestFieldRef : undefined}>
                <FunctionCallingConfigToolField
                  fieldPath={field}
                  formName={formName}
                  index={index}
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
