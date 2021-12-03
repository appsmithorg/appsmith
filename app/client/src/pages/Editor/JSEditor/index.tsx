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
import { getPluginSettingConfigs } from "selectors/entitiesSelector";
import _ from "lodash";

const LoadingContainer = styled(CenteredWrapper)`
  height: 50%;
`;
interface ReduxStateProps {
  jsAction: JSCollection | undefined;
  isCreating: boolean;
  settingsConfig: any;
}

type Props = ReduxStateProps &
  RouteComponentProps<{ apiId: string; pageId: string }>;

class JSEditor extends React.Component<Props> {
  render() {
    const { isCreating, jsAction, settingsConfig } = this.props;
    if (isCreating) {
      return (
        <LoadingContainer>
          <Spinner size={30} />
        </LoadingContainer>
      );
    }
    if (!!jsAction) {
      return (
        <JsEditorForm jsAction={jsAction} settingsConfig={settingsConfig} />
      );
    }
  }
}

const mapStateToProps = (state: AppState, props: Props): ReduxStateProps => {
  const jsAction = getJSCollectionById(state, props);
  const { isCreating } = state.ui.jsPane;
  const pluginId = _.get(jsAction, "pluginId", "");
  const settingsConfig = getPluginSettingConfigs(state, pluginId);

  return {
    jsAction,
    settingsConfig,
    isCreating: isCreating,
  };
};

export default Sentry.withProfiler(connect(mapStateToProps)(JSEditor));
