import React from "react";
import { RouteComponentProps } from "react-router";
import { JSCollection } from "entities/JSCollection";
import { AppState } from "reducers";
import { connect } from "react-redux";
import JsEditorForm from "./Form";
import * as Sentry from "@sentry/react";
import { getJSCollectionById } from "selectors/editorSelectors";
import CenteredWrapper from "components/designSystems/appsmith/CenteredWrapper";
import Spinner from "components/editorComponents/Spinner";
import styled from "styled-components";
import EntityNotFoundPane from "../EntityNotFoundPane";

const LoadingContainer = styled(CenteredWrapper)`
  height: 50%;
`;
interface ReduxStateProps {
  jsCollection: JSCollection | undefined;
  isCreating: boolean;
}

type Props = ReduxStateProps &
  RouteComponentProps<{ apiId: string; pageId: string }>;

class JSEditor extends React.Component<Props> {
  render() {
    const { isCreating, jsCollection } = this.props;
    if (isCreating) {
      return (
        <LoadingContainer>
          <Spinner size={30} />
        </LoadingContainer>
      );
    }
    if (!!jsCollection) {
      return <JsEditorForm jsCollection={jsCollection} />;
    }
    return <EntityNotFoundPane />;
  }
}

const mapStateToProps = (state: AppState, props: Props): ReduxStateProps => {
  const jsCollection = getJSCollectionById(state, props);
  const { isCreating } = state.ui.jsPane;

  return {
    jsCollection,
    isCreating: isCreating,
  };
};

export default Sentry.withProfiler(connect(mapStateToProps)(JSEditor));
