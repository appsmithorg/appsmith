import React, { useCallback, useMemo } from "react";
import CommonEditorForm from "../CommonEditorForm";
import { usePluginActionContext } from "../../../../PluginActionContext";
import { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import { API_EDITOR_FORM_NAME } from "ee/constants/forms";
import { HTTP_METHOD_OPTIONS } from "../../../../constants/CommonApiConstants";
import PostBodyData from "./PostBodyData";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { getHasManageActionPermission } from "ee/utils/BusinessFeatures/permissionPageHelpers";
import Pagination from "./Pagination";
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

  const onTestClick = useCallback(() => {
    callRunActionAnalytics();
    handleRunClick();
  }, [callRunActionAnalytics, handleRunClick]);

  const bodyUIComponent = useMemo(
    () => (
      <PostBodyData
        dataTreePath={`${action.name}.config`}
        theme={EditorTheme.LIGHT}
      />
    ),
    [action.name],
  );

  const paginationUiComponent = useMemo(
    () => (
      <Pagination
        actionName={action.name}
        onTestClick={onTestClick}
        paginationType={action.actionConfiguration.paginationType}
        theme={theme}
      />
    ),
    [
      action.actionConfiguration.paginationType,
      action.name,
      onTestClick,
      theme,
    ],
  );

  return (
    <CommonEditorForm
      action={action}
      // eslint-disable-next-line react-perf/jsx-no-jsx-as-prop
      bodyUIComponent={bodyUIComponent}
      dataTestId="t--api-editor-form"
      formName={API_EDITOR_FORM_NAME}
      httpMethodOptions={HTTP_METHOD_OPTIONS}
      isChangePermitted={isChangePermitted}
      // eslint-disable-next-line react-perf/jsx-no-jsx-as-prop
      paginationUiComponent={paginationUiComponent}
    />
  );
};

export default reduxForm({
  form: API_EDITOR_FORM_NAME,
  enableReinitialize: true,
})(APIEditorForm);
