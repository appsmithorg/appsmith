import React from "react";
import type { RouteComponentProps } from "react-router";
import PageLoadingBar from "pages/common/PageLoadingBar";
import { retryPromise } from "utils/AppsmithUtils";
import type { InitAppViewerPayload } from "actions/initActions";
import { initAppViewerAction } from "actions/initActions";
import { APP_MODE } from "entities/App";
import { connect } from "react-redux";
import { getSearchQuery } from "utils/helpers";
import { GIT_BRANCH_QUERY_KEY } from "constants/routes";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";

type Props = {
  initAppViewer: (payload: InitAppViewerPayload) => void;
  clearCache: () => void;
} & RouteComponentProps<{ basePageId: string; baseApplicationId?: string }>;

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
class AppViewerLoader extends React.PureComponent<Props, { Page: any }> {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(props: any) {
    super(props);

    this.state = {
      Page: null,
    };
  }

  componentDidMount() {
    this.initialize();
    retryPromise(
      async () => import(/* webpackChunkName: "AppViewer" */ "./index"),
    ).then((module) => {
      this.setState({ Page: module.default });
    });
  }

  render() {
    const { Page } = this.state;

    return Page ? <Page {...this.props} /> : <PageLoadingBar />;
  }

  private initialize() {
    const {
      initAppViewer,
      location: { search },
      match: { params },
    } = this.props;
    const { baseApplicationId, basePageId } = params;
    const branch = getSearchQuery(search, GIT_BRANCH_QUERY_KEY);

    // onMount initPage
    if (baseApplicationId || basePageId) {
      initAppViewer({
        baseApplicationId,
        branch,
        basePageId,
        mode: APP_MODE.PUBLISHED,
      });
    }
  }
  componentWillUnmount() {
    const { clearCache } = this.props;

    clearCache();
  }
}

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapDispatchToProps = (dispatch: any) => {
  return {
    initAppViewer: (payload: InitAppViewerPayload) =>
      dispatch(initAppViewerAction(payload)),
    clearCache: () => {
      dispatch({ type: ReduxActionTypes.CLEAR_CACHE });
    },
  };
};

export default connect(null, mapDispatchToProps)(AppViewerLoader);
