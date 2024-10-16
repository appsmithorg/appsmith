import React from "react";
import FormRender from "./FormRender";
import { usePluginActionContext } from "../../../../PluginActionContext";
import { QUERY_EDITOR_FORM_NAME } from "ee/constants/forms";
import { getFormValues, reduxForm } from "redux-form";
import type { QueryAction, SaaSAction } from "entities/Action";
import { useSelector } from "react-redux";
import { getFormEvaluationState } from "selectors/formSelectors";
import { Flex } from "@appsmith/ads";

const UQIEditorForm = () => {
  const { editorConfig, plugin } = usePluginActionContext();

  const formData = useSelector(getFormValues(QUERY_EDITOR_FORM_NAME)) as
    | QueryAction
    | SaaSAction;

  const formEvaluation = useSelector(getFormEvaluationState);

  let formEvaluationState = {};

  // Fetching evaluations state only once the formData is populated
  if (!!formData) {
    formEvaluationState = formEvaluation[formData.id];
  }

  return (
    <Flex flexDirection="column" overflowY="scroll" w="100%">
      <FormRender
        editorConfig={editorConfig}
        formData={formData}
        formEvaluationState={formEvaluationState}
        formName={QUERY_EDITOR_FORM_NAME}
        uiComponent={plugin.uiComponent}
      />
    </Flex>
  );
};

export default reduxForm({
  form: QUERY_EDITOR_FORM_NAME,
  enableReinitialize: true,
})(UQIEditorForm);
