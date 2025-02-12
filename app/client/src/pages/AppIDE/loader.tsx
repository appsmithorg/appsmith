import React from "react";
import type { RouteComponentProps } from "react-router";
import { connect } from "react-redux";

import PageLoadingBar from "pages/common/PageLoadingBar";
import { retryPromise } from "utils/AppsmithUtils";
import type { InitEditorActionPayload } from "actions/initActions";
import { initEditorAction } from "actions/initActions";
import { getSearchQuery } from "utils/helpers";
import { GIT_BRANCH_QUERY_KEY } from "constants/routes";
import { APP_MODE } from "entities/App";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";

type Props = {
  initEditor: (payload: InitEditorActionPayload) => void;
  clearCache: () => void;
} & RouteComponentProps<{ basePageId: string }>;

class AppIDELoader extends React.PureComponent<
  Props,
  { Page: React.ComponentType | null }
> {
  constructor(props: Props) {
    super(props);

    this.state = {
      Page: null,
    };
  }

  initialise() {
    const {
      initEditor,
      location: { search },
      match: { params },
    } = this.props;
    const branch = getSearchQuery(search, GIT_BRANCH_QUERY_KEY);

    const { basePageId } = params;

    if (basePageId) {
      initEditor({
        basePageId,
        branch,
        mode: APP_MODE.EDIT,
      });
    }
  }

  componentDidMount() {
    this.initialise();
    retryPromise(
      async () => import(/* webpackChunkName: "AppIDE" */ "./AppIDE"),
    ).then((module) => {
      this.setState({ Page: module.default });
    });
  }

  componentWillUnmount() {
    const { clearCache } = this.props;

    clearCache();
  }

  render() {
    const { Page } = this.state;

    return Page ? <Page {...this.props} /> : <PageLoadingBar />;
  }
}

const mapDispatchToProps = {
  initEditor: (payload: InitEditorActionPayload) => initEditorAction(payload),
  clearCache: () => ({ type: ReduxActionTypes.CLEAR_CACHE }),
};

export default connect(null, mapDispatchToProps)(AppIDELoader);
