import type { TextViewProps } from "../../types";
import {
  ControlWrapper,
  FieldWrapper,
} from "components/propertyControls/StyledControls";
import { InputText } from "components/propertyControls/InputTextControl";
import { AutocompleteDataType } from "utils/autocomplete/AutocompleteDataType";
import React, { useEffect, useMemo } from "react";
import { getCodeFromMoustache } from "../../utils";
import { useDispatch, useSelector } from "react-redux";
import { EVAL_WORKER_ACTIONS } from "@appsmith/workers/Evaluation/evalWorkerActions";
import { generateReactKey } from "utils/generators";
import {
  clearEvaluatedActionSelectorField,
  evaluateActionSelectorField,
} from "actions/actionSelectorActions";
import { isFunctionPresent } from "@shared/ast";

export function TextView(props: TextViewProps) {
  const id = useMemo(() => generateReactKey(), []);
  const textValue = props.get(props.value, props.index, false) as string;

  const dispatch = useDispatch();

  const codeWithoutMoustache = getCodeFromMoustache(textValue);

  useEffect(() => {
    // If the code contains a function or arrow function, don't evaluate it
    // Because, the evaluations are done in the worker and we can't post functions to the worker
    if (isFunctionPresent(codeWithoutMoustache, window.evaluationVersion))
      return;

    dispatch(
      evaluateActionSelectorField({
        id,
        type: EVAL_WORKER_ACTIONS.EVAL_EXPRESSION,
        value: codeWithoutMoustache,
      }),
    );

    // Clear the evaluated value when the component unmounts
    return () => {
      dispatch(clearEvaluatedActionSelectorField(id));
    };
  }, [codeWithoutMoustache]);

  const evaluatedCodeValue = useSelector(
    (state) => state.ui.actionSelector[id]?.evaluatedValue,
  );

  const value = evaluatedCodeValue?.value || codeWithoutMoustache;

  return (
    <FieldWrapper className="text-view">
      <ControlWrapper isAction key={props.label}>
        {props.label && (
          <label
            className="!text-gray-600 !text-xs"
            data-testid="text-view-label"
            htmlFor={props.label}
          >
            {props.label}
          </label>
        )}
        <InputText
          additionalAutocomplete={props.additionalAutoComplete}
          dataTreePath={props.dataTreePath}
          enableAI={false}
          evaluatedValue={value}
          expected={{
            type: "string",
            example: props.exampleText,
            autocompleteDataType: AutocompleteDataType.STRING,
            openExampleTextByDefault: true,
          }}
          label={props.label}
          onChange={(event: any) => {
            if (event.target) {
              props.set(event.target.value, true);
            } else {
              props.set(event, true);
            }
          }}
          value={textValue}
        />
      </ControlWrapper>
    </FieldWrapper>
  );
}
