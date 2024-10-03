import React from "react";
import { reduxForm } from "redux-form";
import { API_EDITOR_FORM_NAME } from "ee/constants/forms";
import CommonEditorForm from "../CommonEditorForm";
import Pagination from "pages/Editor/APIEditor/GraphQL/Pagination";
import { GRAPHQL_HTTP_METHOD_OPTIONS } from "constants/ApiEditorConstants/GraphQLEditorConstants";
import PostBodyData from "./PostBodyData";
import { usePluginActionContext } from "PluginActionEditor";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { getHasManageActionPermission } from "ee/utils/BusinessFeatures/permissionPageHelpers";
import { noop } from "lodash";
import { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import useGetFormActionValues from "../CommonEditorForm/hooks/useGetFormActionValues";

const FORM_NAME = API_EDITOR_FORM_NAME;

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
      formName={FORM_NAME}
      httpMethodOptions={GRAPHQL_HTTP_METHOD_OPTIONS}
      isChangePermitted={isChangePermitted}
      paginationUiComponent={
        <Pagination
          actionName={action.name}
          formName={FORM_NAME}
          onTestClick={noop}
          paginationType={action.actionConfiguration.paginationType}
          query={actionConfigurationBody}
          theme={theme}
        />
      }
    />
  );
}

export default reduxForm({ form: FORM_NAME, enableReinitialize: true })(
  GraphQLEditorForm,
);
