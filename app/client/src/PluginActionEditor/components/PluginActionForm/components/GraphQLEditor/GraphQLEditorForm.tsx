import React from "react";
import { reduxForm } from "redux-form";
import { API_EDITOR_FORM_NAME } from "ee/constants/forms";
import CommonEditorForm from "../CommonEditorForm";
import Pagination from "./Pagination";
import { GRAPHQL_HTTP_METHOD_OPTIONS } from "../../../../constants/GraphQLEditorConstants";
import PostBodyData from "./PostBodyData";
import { usePluginActionContext } from "../../../../PluginActionContext";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { getHasManageActionPermission } from "ee/utils/BusinessFeatures/permissionPageHelpers";
import { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import useGetFormActionValues from "../CommonEditorForm/hooks/useGetFormActionValues";

function GraphQLEditorForm() {
  const { action } = usePluginActionContext();
  const theme = EditorTheme.LIGHT;

  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);
  const isChangePermitted = getHasManageActionPermission(
    isFeatureEnabled,
    action.userPermissions,
  );

  const { actionConfigurationBody } = useGetFormActionValues();

  return (
    <CommonEditorForm
      action={action}
      bodyUIComponent={<PostBodyData actionName={action.name} />}
      dataTestId="t--graphql-editor-form"
      formName={API_EDITOR_FORM_NAME}
      httpMethodOptions={GRAPHQL_HTTP_METHOD_OPTIONS}
      isChangePermitted={isChangePermitted}
      paginationUiComponent={
        <Pagination
          actionName={action.name}
          formName={API_EDITOR_FORM_NAME}
          paginationType={action.actionConfiguration.paginationType}
          query={actionConfigurationBody}
          theme={theme}
        />
      }
    />
  );
}

export default reduxForm({
  form: API_EDITOR_FORM_NAME,
  enableReinitialize: true,
})(GraphQLEditorForm);
