import React, { useMemo } from "react";

import CurlImportForm from "./CurlImportForm";
import { createNewApiName } from "utils/AppsmithUtils";
import { curlImportSubmitHandler } from "./helpers";
import { getActions } from "@appsmith/selectors/entitiesSelector";
import { getIsImportingCurl } from "selectors/ui";
import { showDebuggerFlag } from "selectors/debuggerSelectors";
import { useSelector } from "react-redux";
import type { RouteComponentProps } from "react-router";
import type { BuilderRouteParams } from "constants/routes";
import CloseEditor from "components/editorComponents/CloseEditor";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";

type CurlImportEditorProps = RouteComponentProps<BuilderRouteParams>;

function CurlImportEditor(props: CurlImportEditorProps) {
  const actions = useSelector(getActions);
  const { pageId } = props.match.params;

  const showDebugger = useSelector(showDebuggerFlag);
  const isImportingCurl = useSelector(getIsImportingCurl);

  const initialFormValues = {
    pageId,
    name: createNewApiName(actions, pageId),
  };
  const isPagesPaneEnabled = useFeatureFlag(
    FEATURE_FLAG.release_show_new_sidebar_pages_pane_enabled,
  );

  const closeEditorLink = useMemo(() => <CloseEditor />, []);

  return (
    <CurlImportForm
      closeEditorLink={isPagesPaneEnabled ? null : closeEditorLink}
      curlImportSubmitHandler={curlImportSubmitHandler}
      initialValues={initialFormValues}
      isImportingCurl={isImportingCurl}
      showDebugger={showDebugger}
    />
  );
}

export default CurlImportEditor;
