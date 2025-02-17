import { Button, Text } from "@appsmith/ads";
import type { AppState } from "ee/reducers";
import FormControl from "pages/Editor/FormControl";
import React, { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { change, formValueSelector } from "redux-form";
import styled from "styled-components";
import type { DropDownGroupedOptions } from "../../DropDownControl";
import type {
  FunctionCallingEntityTypeOption,
  FunctionCallingEntityType,
} from "../types";
import { selectEntityOptions } from "./selectors";

interface FunctionCallingConfigToolFieldProps {
  fieldPath: string;
  formName: string;
  index: number;
  onRemove: (index: number) => void;
}

const ConfigItemRoot = styled.div`
  display: flex;
  flex-direction: column;
  padding: var(--ads-v2-spaces-3);
  border-radius: var(--ads-v2-border-radius);
  border: 1px solid var(--ads-v2-color-border);
  background: var(--colors-semantics-bg-inset, #f8fafc);
`;

const ConfigItemRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: var(--ads-v2-spaces-4);
  justify-content: space-between;
  margin-bottom: var(--ads-v2-spaces-4);
`;

const ConfigItemSelectWrapper = styled.div`
  width: 50%;
  min-width: 160px;
`;

export const FunctionCallingConfigToolField = ({
  index,
  onRemove,
  ...props
}: FunctionCallingConfigToolFieldProps) => {
  const dispatch = useDispatch();
  const fieldValue = useSelector((state: AppState) =>
    formValueSelector(props.formName)(state, props.fieldPath),
  );
  const entityOptions = useSelector(selectEntityOptions);

  const handleRemoveButtonClick = useCallback(() => {
    onRemove(index);
  }, [onRemove, index]);

  const findEntityOption = useCallback(
    (entityId: string, items: FunctionCallingEntityTypeOption[]): boolean => {
      return items.find(({ value }) => value === entityId) !== undefined;
    },
    [entityOptions],
  );

  const findEntityType = useCallback(
    (entityId: string): string => {
      switch (true) {
        case findEntityOption(entityId, entityOptions.Query):
          return "Query";
        case findEntityOption(entityId, entityOptions.JSFunction):
          return "JSFunction";
        case findEntityOption(entityId, entityOptions.SystemFunction):
          return "SystemFunction";
      }

      return "";
    },
    [fieldValue.entityId, entityOptions],
  );

  useEffect(
    // entityType is dependent on entityId
    // Every time entityId changes, we need to find the new entityType
    function handleEntityTypeChange() {
      const entityType = findEntityType(fieldValue.entityId);

      dispatch(
        change(props.formName, `${props.fieldPath}.entityType`, entityType),
      );
    },
    [fieldValue.entityId],
  );

  return (
    <ConfigItemRoot>
      <ConfigItemRow>
        <Text isBold renderAs="p">
          Function
        </Text>
        <Button
          isIconButton
          kind="tertiary"
          onClick={handleRemoveButtonClick}
          startIcon="trash"
        />
      </ConfigItemRow>
      <ConfigItemRow>
        <ConfigItemSelectWrapper>
          <FormControl
            config={{
              controlType: "DROP_DOWN",
              configProperty: `${props.fieldPath}.entityId`,
              formName: props.formName,
              id: props.fieldPath,
              label: "",
              isValid: true,
              // @ts-expect-error FormControl component has incomplete TypeScript definitions for some valid properties
              isSearchable: true,
              options: [
                ...entityOptions.Query,
                ...entityOptions.JSFunction,
                ...entityOptions.SystemFunction,
              ],
              optionGroupConfig: {
                Query: {
                  label: "Queries",
                  children: [],
                },
                JSFunction: {
                  label: "JS Functions",
                  children: [],
                },
                SystemFunction: {
                  label: "System Functions",
                  children: [],
                },
              } satisfies Record<
                FunctionCallingEntityType,
                DropDownGroupedOptions
              >,
            }}
            formName={props.formName}
          />
        </ConfigItemSelectWrapper>
        <FormControl
          config={{
            controlType: "SWITCH",
            configProperty: `${props.fieldPath}.requiresApproval`,
            formName: props.formName,
            id: props.fieldPath,
            label: "Requires approval",
            isValid: true,
          }}
          formName={props.formName}
        />
      </ConfigItemRow>
      <FormControl
        config={{
          controlType: "QUERY_DYNAMIC_INPUT_TEXT",
          configProperty: `${props.fieldPath}.description`,
          formName: props.formName,
          id: props.fieldPath,
          placeholderText: "Describe how this function should be used...",
          label: "Description",
          isValid: true,
        }}
        formName={props.formName}
      />
    </ConfigItemRoot>
  );
};
