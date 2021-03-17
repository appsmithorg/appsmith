import React, { Component } from "react";
import { Helmet } from "react-helmet";
import { connect } from "react-redux";
import { RouteComponentProps, withRouter } from "react-router-dom";
import { Spinner } from "@blueprintjs/core";
import { BuilderRouteParams } from "constants/routes";
import { AppState } from "reducers";
import MainContainer from "./MainContainer";
import { DndProvider } from "react-dnd";
import TouchBackend from "react-dnd-touch-backend";
import {
  getCurrentApplicationId,
  getCurrentPageId,
  getIsEditorInitialized,
  getIsEditorLoading,
  getIsPublishingApplication,
  getPublishingError,
} from "selectors/editorSelectors";
import { initEditor, resetEditorRequest } from "actions/initActions";
import { editorInitializer } from "utils/EditorUtils";
import CenteredWrapper from "components/designSystems/appsmith/CenteredWrapper";
import { getCurrentUser } from "selectors/usersSelectors";
import { User } from "constants/userConstants";
import ConfirmRunModal from "pages/Editor/ConfirmRunModal";
import * as Sentry from "@sentry/react";
import { getSelectedWidget } from "selectors/ui";
import Welcome from "./Welcome";
import { getThemeDetails, ThemeMode } from "selectors/themeSelectors";
import { ThemeProvider } from "styled-components";
import { Theme } from "constants/DefaultTheme";
import GlobalHotKeys from "./GlobalHotKeys";
import { handlePathUpdated } from "actions/recentEntityActions";

import history from "utils/history";

type EditorProps = {
  currentApplicationId?: string;
  currentPageId?: string;
  initEditor: (applicationId: string, pageId: string) => void;
  isPublishing: boolean;
  isEditorLoading: boolean;
  isEditorInitialized: boolean;
  isEditorInitializeError: boolean;
  errorPublishing: boolean;
  creatingOnboardingDatabase: boolean;
  user?: User;
  selectedWidget?: string;
  lightTheme: Theme;
  resetEditorRequest: () => void;
  handlePathUpdated: (pathName: string) => void;
};

type Props = EditorProps & RouteComponentProps<BuilderRouteParams>;

class Editor extends Component<Props> {
  unlisten: any;

  public state = {
    registered: false,
  };

  componentDidMount() {
    editorInitializer().then(() => {
      this.setState({ registered: true });
    });
    const { applicationId, pageId } = this.props.match.params;
    if (applicationId && pageId) {
      this.props.initEditor(applicationId, pageId);
    }
    this.props.handlePathUpdated(window.location.pathname);
    this.unlisten = history.listen(this.handleHistoryChange);
  }

  shouldComponentUpdate(nextProps: Props, nextState: { registered: boolean }) {
    return (
      nextProps.currentPageId !== this.props.currentPageId ||
      nextProps.currentApplicationId !== this.props.currentApplicationId ||
      nextProps.isEditorInitialized !== this.props.isEditorInitialized ||
      nextProps.isPublishing !== this.props.isPublishing ||
      nextProps.isEditorLoading !== this.props.isEditorLoading ||
      nextProps.errorPublishing !== this.props.errorPublishing ||
      nextProps.isEditorInitializeError !==
        this.props.isEditorInitializeError ||
      nextProps.creatingOnboardingDatabase !==
        this.props.creatingOnboardingDatabase ||
      nextState.registered !== this.state.registered
    );
  }

  componentWillUnmount() {
    this.props.resetEditorRequest();
    if (typeof this.unlisten === "function") this.unlisten();
  }

  handleHistoryChange = (location: any) => {
    this.props.handlePathUpdated(location.pathname);
  };

  public render() {
    if (this.props.creatingOnboardingDatabase) {
      return <Welcome />;
    }

    if (!this.props.isEditorInitialized || !this.state.registered) {
      return (
        <CenteredWrapper style={{ height: "calc(100vh - 35px)" }}>
          <Spinner />
        </CenteredWrapper>
      );
    }
    return (
      <ThemeProvider theme={this.props.lightTheme}>
        <DndProvider
          backend={TouchBackend}
          options={{
            enableMouseEvents: true,
          }}
        >
          <div>
            <Helmet>
              <meta charSet="utf-8" />
              <title>Editor | Appsmith</title>
            </Helmet>
            <GlobalHotKeys>
              <MainContainer />
            </GlobalHotKeys>
          </div>
          <ConfirmRunModal />
        </DndProvider>
      </ThemeProvider>
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  currentApplicationId: getCurrentApplicationId(state),
  currentPageId: getCurrentPageId(state),
  errorPublishing: getPublishingError(state),
  isPublishing: getIsPublishingApplication(state),
  isEditorLoading: getIsEditorLoading(state),
  isEditorInitialized: getIsEditorInitialized(state),
  user: getCurrentUser(state),
  selectedWidget: getSelectedWidget(state),
  creatingOnboardingDatabase: state.ui.onBoarding.showOnboardingLoader,
  lightTheme: getThemeDetails(state, ThemeMode.LIGHT),
});

const mapDispatchToProps = (dispatch: any) => {
  return {
    initEditor: (applicationId: string, pageId: string) =>
      dispatch(initEditor(applicationId, pageId)),
    resetEditorRequest: () => dispatch(resetEditorRequest()),
    handlePathUpdated: (pathName: string) =>
      dispatch(handlePathUpdated(pathName)),
  };
};

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(Sentry.withProfiler(Editor)),
);
