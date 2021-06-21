import React from "react";
import { RouteComponentProps } from "react-router";
import { JSAction } from "entities/JSAction";
import { AppState } from "reducers";
import { connect } from "react-redux";
import JSEditorForm from "./Form";
import * as Sentry from "@sentry/react";
import { getJSActionById } from "selectors/editorSelectors";
import CenteredWrapper from "components/designSystems/appsmith/CenteredWrapper";
import Spinner from "components/editorComponents/Spinner";
import styled from "styled-components";

const LoadingContainer = styled(CenteredWrapper)`
  height: 50%;
`;
interface ReduxStateProps {
  jsAction: JSAction | undefined;
  isCreating: boolean;
}

type Props = ReduxStateProps &
  RouteComponentProps<{ apiId: string; applicationId: string; pageId: string }>;

class JSEditor extends React.Component<Props> {
  render() {
    const { isCreating, jsAction } = this.props;
    if (isCreating) {
      return (
        <LoadingContainer>
          <Spinner size={30} />
        </LoadingContainer>
      );
    }
    return <JSEditorForm jsAction={jsAction} />;
  }
}

const mapStateToProps = (state: AppState, props: any): ReduxStateProps => {
  const jsAction = getJSActionById(state, props);
  const { isCreating, isDeleting, isRunning } = state.ui.jsPane;

  return { jsAction, isCreating: isCreating };
};

export default Sentry.withProfiler(connect(mapStateToProps)(JSEditor));
