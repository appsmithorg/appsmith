import React, { useMemo, useRef } from "react";
import styled from "styled-components";
import { debounce } from "lodash";
import { Text } from "design-system";
import { useDispatch } from "react-redux";
import { klona } from "klona";

import Form from "@appsmith/components/InputsForm/Form";
import SectionField from "@appsmith/components/InputsForm/Fields/SectionField";
import { updateModuleInputs } from "@appsmith/actions/moduleActions";
import type { Module } from "@appsmith/constants/ModuleConstants";
import { generateDefaultInputSection } from "@appsmith/components/InputsForm/Fields/helper";
import useEvalValues from "./hooks/useEvalValues";
import equal from "fast-deep-equal/es6";

const StyledHeading = styled(Text)`
  margin-bottom: var(--ads-v2-spaces-3);
`;

const InstructionsWrapper = styled.div`
  margin-bottom: var(--ads-v2-spaces-3);
`;

const StyledWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
`;

const StyledBody = styled.div`
  flex: 1;
  height: 100%;
  margin-top: var(--ads-v2-spaces-4);
  margin-bottom: var(--ads-v2-spaces-4);
  overflow-y: auto;
`;

interface DEFAULT_VALUES {
  inputsForm: Module["inputsForm"];
}

interface ModuleInputsFormProps {
  moduleId?: string;
  defaultValues?: DEFAULT_VALUES;
}

const generateDefaultInputForm = () => {
  const defaultInputSection = generateDefaultInputSection();

  return { inputsForm: [defaultInputSection] };
};

const DEBOUNCE_TIMEOUT = 300;

function ModuleInputsForm({ defaultValues, moduleId }: ModuleInputsFormProps) {
  const dispatch = useDispatch();
  const valuesRef = useRef(defaultValues?.inputsForm);

  const onUpdateInputsForm = useMemo(() => {
    const onUpdate = (values: { inputsForm: Module["inputsForm"] }) => {
      if (!moduleId) return;

      if (!equal(values.inputsForm, valuesRef.current)) {
        valuesRef.current = klona(values.inputsForm);

        dispatch(
          updateModuleInputs({
            id: moduleId,
            inputsForm: values.inputsForm,
          }),
        );
      }
    };

    return debounce(onUpdate, DEBOUNCE_TIMEOUT);
  }, [updateModuleInputs, moduleId, dispatch]);

  return (
    <StyledWrapper>
      <StyledHeading className="label" kind="heading-s">
        Inputs
      </StyledHeading>
      <StyledBody>
        <InstructionsWrapper>
          <Text>
            To use an input in this query, wrap the input name inside double
            curly braces:
          </Text>
          <br />
          <br />
          <Text>{`select * from users where id = {{ input_name }}`}</Text>
        </InstructionsWrapper>
        <Form
          defaultValues={defaultValues || generateDefaultInputForm()}
          onUpdateForm={onUpdateInputsForm}
          useEvalValues={useEvalValues}
        >
          <SectionField name="inputsForm" />
        </Form>
      </StyledBody>
    </StyledWrapper>
  );
}

export default ModuleInputsForm;
