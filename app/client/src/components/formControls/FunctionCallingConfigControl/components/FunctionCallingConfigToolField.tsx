import { Button, Text } from "@appsmith/ads";
import FormControl from "pages/Editor/FormControl";
import React, { useCallback, useMemo } from "react";
import { useDispatch } from "react-redux";
import { change } from "redux-form";
import styled from "styled-components";
import type { FunctionCallingEntityType } from "../types";
import FunctionCallingMenuField from "./FunctionCallingMenuField";

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

  const handleRemoveButtonClick = useCallback(() => {
    onRemove(index);
  }, [onRemove, index]);

  // entityType is dependent on entityId
  // Every time entityId changes, we need to find the new entityType
  const handleFunctionChange = useCallback(
    (entityId: string, entityType: FunctionCallingEntityType) => {
      dispatch(
        change(props.formName, `${props.fieldPath}.entityType`, entityType),
      );
    },
    [dispatch, props.formName, props.fieldPath],
  );

  const ApprovalSwitchConfig = useMemo(
    () => ({
      controlType: "SWITCH",
      configProperty: `${props.fieldPath}.isApprovalRequired`,
      formName: props.formName,
      id: props.fieldPath,
      label: "Requires approval",
      isValid: true,
    }),
    [props.fieldPath, props.formName],
  );

  const FunctionDescriptionInputConfig = useMemo(
    () => ({
      controlType: "QUERY_DYNAMIC_INPUT_TEXT",
      configProperty: `${props.fieldPath}.description`,
      formName: props.formName,
      id: props.fieldPath,
      placeholderText: "Describe how this function should be used...",
      label: "Description",
      isValid: true,
    }),
    [props.fieldPath, props.formName],
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
          <FunctionCallingMenuField
            name={`${props.fieldPath}.entityId`}
            onValueChange={handleFunctionChange}
          />
        </ConfigItemSelectWrapper>
        <FormControl config={ApprovalSwitchConfig} formName={props.formName} />
      </ConfigItemRow>
      <FormControl
        config={FunctionDescriptionInputConfig}
        formName={props.formName}
      />
    </ConfigItemRoot>
  );
};
