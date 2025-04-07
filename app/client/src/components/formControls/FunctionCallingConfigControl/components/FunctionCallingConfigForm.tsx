import {
  Button,
  Flex,
  Icon,
  Menu,
  MenuContent,
  MenuGroup,
  MenuItem,
  MenuSub,
  MenuSubContent,
  MenuSubTrigger,
  MenuTrigger,
  Text,
} from "@appsmith/ads";
import React, { useCallback, useMemo, useState } from "react";
import type { FieldArrayFieldsProps } from "redux-form";
import styled from "styled-components";
import { v4 as uuid } from "uuid";
import type {
  FunctionCallingConfigFormToolField,
  FunctionCallingEntityType,
  FunctionCallingEntityTypeOption,
} from "../types";
import { FunctionCallingConfigToolField } from "./FunctionCallingConfigToolField";
import { useSelector } from "react-redux";
import { selectEntityOptions } from "./selectors";
import { createNewJSCollection } from "actions/jsPaneActions";
import { queryAddURL } from "ee/RouteBuilder";
import history from "utils/history";
import { useDispatch } from "react-redux";
import { getCurrentPageId } from "selectors/editorSelectors";

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
  const options = useSelector(selectEntityOptions);
  const dispatch = useDispatch();
  const pageId = useSelector(getCurrentPageId);

  // Get existing entity IDs from the agentFunctions, excluding the currently selected value
  const existingEntityIds = useMemo(() => {
    const agentFunctionIds = new Set(Object.keys(options.agentFunctions));

    return agentFunctionIds;
  }, [options.agentFunctions]);

  // Filter query items to exclude existing entities
  const filteredQueryItems = useMemo(() => {
    return options.Query.filter((item) => !existingEntityIds.has(item.value));
  }, [options.Query, existingEntityIds]);

  // Filter JS collection items
  const filteredJSCollections = useMemo(() => {
    return options.JSCollections.map((collection) => ({
      ...collection,
      // Filter out functions that are already used
      functions: collection.functions.filter(
        (func) => !existingEntityIds.has(func.value),
      ),
    })).filter((collection) => collection.functions.length > 0);
  }, [options.JSCollections, existingEntityIds]);

  const handleAddFunctionButtonClick = useCallback(
    (option: FunctionCallingEntityTypeOption) => {
      const id = uuid();

      fields.push({
        id,
        description: "",
        entityId: option.value,
        isApprovalRequired: false,
        entityType: option.optionGroupType as FunctionCallingEntityType,
      });
      setNewlyAddedId(id);
    },
    [fields],
  );

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
          Function Calls
        </Text>

        <Menu>
          <MenuTrigger>
            <Button UNSAFE_width="110px" kind="secondary" startIcon="plus">
              Add Function
            </Button>
          </MenuTrigger>
          <MenuContent align="end" loop width="235px">
            {/* Create new options */}
            <MenuGroup>
              <MenuItem onSelect={() => history.push(queryAddURL({}))}>
                <Flex alignItems="center" gap="spaces-2">
                  <Icon name="plus" size="md" />
                  New Query
                </Flex>
              </MenuItem>
              <MenuItem
                onSelect={() =>
                  dispatch(
                    createNewJSCollection(
                      pageId,
                      "AI_QUERY_FUNCTION_CALLING_CONFIG",
                      "onToolCall",
                    ),
                  )
                }
              >
                <Flex alignItems="center" gap="spaces-2">
                  <Icon name="plus" size="md" />
                  New JS Object
                </Flex>
              </MenuItem>
            </MenuGroup>

            {/* Query options group */}
            {options.Query.length > 0 && (
              <MenuGroup>
                {filteredQueryItems.map((option) => (
                  <MenuItem
                    key={option.value}
                    onSelect={() => handleAddFunctionButtonClick(option)}
                  >
                    <Flex alignItems="center" gap="spaces-2">
                      {option.icon &&
                        (typeof option.icon === "string" ? (
                          <Icon name={option.icon} size="md" />
                        ) : (
                          option.icon
                        ))}
                      {option.label}
                    </Flex>
                  </MenuItem>
                ))}
              </MenuGroup>
            )}

            {/* JS Collections group with nested functions */}
            {options.JSCollections.length > 0 && (
              <MenuGroup>
                <MenuGroup>
                  {filteredJSCollections.map((collection) => (
                    <MenuSub key={collection.id}>
                      <MenuSubTrigger>
                        <Flex alignItems="center" gap="spaces-2">
                          {collection.icon &&
                            (typeof collection.icon === "string" ? (
                              <Icon name={collection.icon} size="md" />
                            ) : (
                              collection.icon
                            ))}
                          {collection.name}
                        </Flex>
                      </MenuSubTrigger>
                      <MenuSubContent>
                        {collection.functions.map((jsFunction) => (
                          <MenuItem
                            key={jsFunction.value}
                            onSelect={() =>
                              handleAddFunctionButtonClick(jsFunction)
                            }
                          >
                            {jsFunction.label}
                          </MenuItem>
                        ))}
                      </MenuSubContent>
                    </MenuSub>
                  ))}
                </MenuGroup>
              </MenuGroup>
            )}
          </MenuContent>
        </Menu>
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
