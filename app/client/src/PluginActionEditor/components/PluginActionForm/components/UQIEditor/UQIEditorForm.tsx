import React from "react";
import FormRender from "./FormRender";
import { usePluginActionContext } from "../../../../PluginActionContext";
import { QUERY_EDITOR_FORM_NAME } from "ee/constants/forms";
import { reduxForm } from "redux-form";
import { Flex } from "@appsmith/ads";
import { useGoogleSheetsSetDefaultProperty } from "./hooks/useGoogleSheetsSetDefaultProperty";
import { useFormData } from "./hooks/useFormData";
import { useInitFormEvaluation } from "./hooks/useInitFormEvaluation";

const UQIEditorForm = () => {
  const {
    editorConfig,
    plugin: { uiComponent },
  } = usePluginActionContext();

  useInitFormEvaluation();

  // Set default values for Google Sheets
  useGoogleSheetsSetDefaultProperty();

  const { data, evaluationState } = useFormData();

  return (
    <Flex flexDirection="column" overflowY="scroll" w="100%">
      <FormRender
        editorConfig={editorConfig}
        formData={data}
        formEvaluationState={evaluationState}
        formName={QUERY_EDITOR_FORM_NAME}
        uiComponent={uiComponent}
      />
    </Flex>
  );
};

export default reduxForm({
  form: QUERY_EDITOR_FORM_NAME,
  enableReinitialize: true,
})(UQIEditorForm);
