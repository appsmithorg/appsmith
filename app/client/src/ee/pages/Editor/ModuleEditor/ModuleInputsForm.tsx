import React, { useMemo } from "react";
import styled from "styled-components";
import { debounce } from "lodash";
import { Text } from "design-system";
import { useDispatch, useSelector } from "react-redux";
import { klona } from "klona";

import Form from "@appsmith/components/InputsForm/Form";
import SectionField from "@appsmith/components/InputsForm/Fields/SectionField";
import { updateModuleInputs } from "@appsmith/actions/moduleActions";
import type { Module } from "@appsmith/constants/ModuleConstants";
import { generateDefaultInputSection } from "@appsmith/components/InputsForm/Fields/helper";
import { getModuleInputsEvalValues } from "@appsmith/selectors/modulesSelector";

const StyledHeading = styled(Text)`
  margin-bottom: var(--ads-v2-spaces-3);
`;

const InstructionsWrapper = styled.div`
  margin-bottom: var(--ads-v2-spaces-4);
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

const StyledExample = styled(Text)`
  display: block;
  font-size: 13px;
  margin-top: var(--ads-v2-spaces-2);
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

const DEBOUNCE_TIMEOUT = 150;

function ModuleInputsForm({ defaultValues, moduleId }: ModuleInputsFormProps) {
  const dispatch = useDispatch();
  const inputsEvaluatedValues = useSelector(
    getModuleInputsEvalValues,
  ) as Record<string, unknown>;

  const onUpdateInputsForm = useMemo(() => {
    const onUpdate = (values: { inputsForm: Module["inputsForm"] }) => {
      if (!moduleId) return;

      const newValues = klona(values.inputsForm);

      newValues.forEach((section) => {
        section.children.forEach((sectionProperties) => {
          sectionProperties.propertyName = `inputs.${sectionProperties.label}`;
        });
      });

      dispatch(
        updateModuleInputs({
          id: moduleId,
          inputsForm: newValues,
        }),
      );
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
          <StyledExample kind="code">{`{{ inputs.input_name }}`}</StyledExample>
        </InstructionsWrapper>
        <Form
          dataTreePathPrefix="inputs"
          defaultValues={defaultValues || generateDefaultInputForm()}
          evaluatedValues={inputsEvaluatedValues}
          onUpdateForm={onUpdateInputsForm}
        >
          <SectionField name="inputsForm" />
        </Form>
      </StyledBody>
    </StyledWrapper>
  );
}

export default ModuleInputsForm;
