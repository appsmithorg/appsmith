import React, { useMemo } from "react";

import CurlImportForm from "./CurlImportForm";
import { curlImportSubmitHandler } from "./helpers";
import { getNewEntityName } from "@appsmith/selectors/entitiesSelector";
import { getIsImportingCurl } from "selectors/ui";
import { showDebuggerFlag } from "selectors/debuggerSelectors";
import { useSelector } from "react-redux";
import type { RouteComponentProps } from "react-router";
import type { BuilderRouteParams } from "constants/routes";
import CloseEditor from "components/editorComponents/CloseEditor";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import { CreateNewActionKey } from "@appsmith/entities/Engine/actionHelpers";
import { DEFAULT_PREFIX } from "sagas/ActionSagas";

type CurlImportEditorProps = RouteComponentProps<BuilderRouteParams>;

function CurlImportEditor(props: CurlImportEditorProps) {
  const { pageId } = props.match.params;
  const actionName = useSelector((state) =>
    getNewEntityName(state, {
      prefix: DEFAULT_PREFIX.API,
      parentEntityId: pageId,
      parentEntityKey: CreateNewActionKey.PAGE,
    }),
  );

  const showDebugger = useSelector(showDebuggerFlag);
  const isImportingCurl = useSelector(getIsImportingCurl);

  const initialFormValues = {
    pageId,
    name: actionName,
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
