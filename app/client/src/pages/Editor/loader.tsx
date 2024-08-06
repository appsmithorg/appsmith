import React from "react";
import PageLoadingBar from "pages/common/PageLoadingBar";
import { retryPromise } from "utils/AppsmithUtils";
import { connect } from "react-redux";
import type { InitEditorActionPayload } from "actions/initActions";
import { initEditorAction } from "actions/initActions";
import { getSearchQuery } from "../../utils/helpers";
import { GIT_BRANCH_QUERY_KEY } from "../../constants/routes";
import { APP_MODE } from "../../entities/App";
import type { RouteComponentProps } from "react-router";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";

type Props = {
  initEditor: (payload: InitEditorActionPayload) => void;
  clearCache: () => void;
} & RouteComponentProps<{ basePageId: string }>;

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
class EditorLoader extends React.PureComponent<Props, { Page: any }> {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(props: any) {
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
      async () => import(/* webpackChunkName: "editor" */ "./index"),
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

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapDispatchToProps = (dispatch: any) => {
  return {
    initEditor: (payload: InitEditorActionPayload) =>
      dispatch(initEditorAction(payload)),
    clearCache: () => {
      dispatch({ type: ReduxActionTypes.CLEAR_CACHE });
    },
  };
};

export default connect(null, mapDispatchToProps)(EditorLoader);
