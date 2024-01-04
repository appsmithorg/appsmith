import React, { useEffect } from "react";
import type { RouteComponentProps } from "react-router";
import Helmet from "react-helmet";
import { ThemeProvider } from "styled-components";
import GlobalHotKeys from "pages/Editor/GlobalHotKeys";
import { ThemeMode, getTheme } from "selectors/themeSelectors";
import {
  getCurrentWorkflowName,
  getIsWorkflowEditorInitialized,
} from "@appsmith/selectors/workflowSelectors";
import { useDispatch, useSelector } from "react-redux";
import CenteredWrapper from "components/designSystems/appsmith/CenteredWrapper";
import { Spinner } from "design-system";
import urlBuilder from "@appsmith/entities/URLRedirect/URLAssembly";
import { setCurrentWorkflow } from "@appsmith/actions/workflowActions";
import WorkflowIDE from "./WorkflowIDE";

const theme = getTheme(ThemeMode.LIGHT);

interface RouteProps {
  workflowId: string;
}

export type WorkflowEditorProps = RouteComponentProps<RouteProps>;

function WorkflowEditor({ match }: WorkflowEditorProps) {
  const { workflowId } = match.params;
  const dispatch = useDispatch();
  const currentWorkflowName = useSelector(getCurrentWorkflowName);

  useEffect(() => {
    urlBuilder.setCurrentWorkflowId(workflowId);

    return () => {
      dispatch(setCurrentWorkflow(null));
      urlBuilder.setCurrentWorkflowId(null);
    };
  }, [workflowId]);

  const isWorkflowEditorInitialized = useSelector(
    getIsWorkflowEditorInitialized,
  );
  if (!isWorkflowEditorInitialized) {
    return (
      <CenteredWrapper
        style={{ height: `calc(100vh - ${theme.smallHeaderHeight})` }}
      >
        <Spinner size="lg" />
      </CenteredWrapper>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <div>
        <Helmet>
          <meta charSet="utf-8" />
          <title>{`${currentWorkflowName} | Editor | Appsmith`}</title>
        </Helmet>

        <GlobalHotKeys>
          <WorkflowIDE />
        </GlobalHotKeys>
      </div>
    </ThemeProvider>
  );
}

export default WorkflowEditor;
