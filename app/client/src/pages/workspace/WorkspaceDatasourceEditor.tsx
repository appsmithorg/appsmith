import React, { useEffect } from "react";
import { useParams } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import DataSourceEditor from "pages/Editor/DataSourceEditor";
import { setCurrentEditingEnvironmentID } from "ee/actions/environmentAction";
import { getCurrentEnvironmentDetails } from "ee/selectors/environmentSelectors";

const WorkspaceDatasourceEditor = () => {
  const { datasourceId, workspaceId } = useParams<{
    datasourceId: string;
    workspaceId: string;
  }>();
  const dispatch = useDispatch();
  const currentEnvironmentDetails = useSelector(getCurrentEnvironmentDetails);

  // Update environment whenever it changes in parent
  useEffect(() => {
    if (
      currentEnvironmentDetails.id &&
      currentEnvironmentDetails.id !== "unused_env"
    ) {
      dispatch(setCurrentEditingEnvironmentID(currentEnvironmentDetails.id));
    }
  }, [dispatch, currentEnvironmentDetails.id]);

  // For workspace context, we need to provide a minimal applicationId and pageId
  // that won't trigger unnecessary API calls but will satisfy the DataSourceEditor
  const workspaceApplicationId = `workspace-app-${workspaceId}`;
  const workspacePageId = `workspace-page-${workspaceId}`;

  return (
    <DataSourceEditor
      applicationId={workspaceApplicationId}
      datasourceId={datasourceId}
      isWorkspaceContext
      pageId={workspacePageId}
    />
  );
};

export default WorkspaceDatasourceEditor;
