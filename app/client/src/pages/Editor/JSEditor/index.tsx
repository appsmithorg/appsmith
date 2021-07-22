import React from "react";
import { RouteComponentProps } from "react-router";
import { JSAction } from "entities/JSAction";
import { AppState } from "reducers";
import { connect } from "react-redux";
import JsEditorForm from "./Form";
import * as Sentry from "@sentry/react";
import { getJSActionById } from "selectors/editorSelectors";
import CenteredWrapper from "components/designSystems/appsmith/CenteredWrapper";
import Spinner from "components/editorComponents/Spinner";
import styled from "styled-components";
import { getPluginSettingConfigs } from "selectors/entitiesSelector";
import _ from "lodash";

const LoadingContainer = styled(CenteredWrapper)`
  height: 50%;
`;
interface ReduxStateProps {
  jsAction: JSAction | undefined;
  isCreating: boolean;
  settingsConfig: any;
}

type Props = ReduxStateProps &
  RouteComponentProps<{ apiId: string; applicationId: string; pageId: string }>;

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
    if (jsAction) {
      return (
        <JsEditorForm jsAction={jsAction} settingsConfig={settingsConfig} />
      );
    }
  }
}

const mapStateToProps = (state: AppState, props: any): ReduxStateProps => {
  const jsAction = getJSActionById(state, props);
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
