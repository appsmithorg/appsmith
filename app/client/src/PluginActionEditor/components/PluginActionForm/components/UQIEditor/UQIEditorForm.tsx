import React from "react";
import FormRender from "./FormRender";
import { usePluginActionContext } from "../../../../PluginActionContext";
import { QUERY_EDITOR_FORM_NAME } from "ee/constants/forms";
import { reduxForm } from "redux-form";
import { Flex } from "@appsmith/ads";
import { PluginPackageName } from "entities/Plugin";
import AppsmithAIDeprecationCallout from "components/editorComponents/AppsmithAIDeprecationCallout";
import { useGoogleSheetsSetDefaultProperty } from "./hooks/useGoogleSheetsSetDefaultProperty";
import { useFormData } from "./hooks/useFormData";

const UQIEditorForm = () => {
  const { editorConfig, plugin } = usePluginActionContext();
  const { uiComponent } = plugin;

  // Set default values for Google Sheets
  useGoogleSheetsSetDefaultProperty();

  const { data, evaluationState } = useFormData();

  if (!data) {
    return null;
  }

  return (
    <Flex
      alignItems="center"
      data-testid="t--uqi-editor-form"
      flexDirection="column"
      w="100%"
    >
      {plugin.packageName === PluginPackageName.APPSMITH_AI && (
        <AppsmithAIDeprecationCallout />
      )}
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
