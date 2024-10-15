import React from "react";
import CommonEditorForm from "./CommonEditorForm";
import { usePluginActionContext } from "PluginActionEditor";
import { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import { API_EDITOR_FORM_NAME } from "ee/constants/forms";
import { HTTP_METHOD_OPTIONS } from "constants/ApiEditorConstants/CommonApiConstants";
import PostBodyData from "pages/Editor/APIEditor/PostBodyData";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { getHasManageActionPermission } from "ee/utils/BusinessFeatures/permissionPageHelpers";
import Pagination from "pages/Editor/APIEditor/Pagination";
import { reduxForm } from "redux-form";
import {
  useHandleRunClick,
  useAnalyticsOnRunClick,
} from "PluginActionEditor/hooks";

const APIEditorForm = () => {
  const { action } = usePluginActionContext();
  const { handleRunClick } = useHandleRunClick();
  const { callRunActionAnalytics } = useAnalyticsOnRunClick();
  const theme = EditorTheme.LIGHT;

  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);
  const isChangePermitted = getHasManageActionPermission(
    isFeatureEnabled,
    action.userPermissions,
  );

  const onTestClick = () => {
    callRunActionAnalytics();
    handleRunClick();
  };

  return (
    <CommonEditorForm
      action={action}
      bodyUIComponent={
        <PostBodyData
          dataTreePath={`${action.name}.config`}
          theme={EditorTheme.LIGHT}
        />
      }
      formName={API_EDITOR_FORM_NAME}
      httpMethodOptions={HTTP_METHOD_OPTIONS}
      isChangePermitted={isChangePermitted}
      paginationUiComponent={
        <Pagination
          actionName={action.name}
          onTestClick={onTestClick}
          paginationType={action.actionConfiguration.paginationType}
          theme={theme}
        />
      }
    />
  );
};

export default reduxForm({
  form: API_EDITOR_FORM_NAME,
  enableReinitialize: true,
})(APIEditorForm);
