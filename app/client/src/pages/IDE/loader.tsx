import React from "react";
import PageLoadingBar from "pages/common/PageLoadingBar";
import { retryPromise } from "utils/AppsmithUtils";
import { connect } from "react-redux";
import type { InitializeEditorPayload } from "actions/initActions";
import { initEditor } from "actions/initActions";
import { getSearchQuery } from "../../utils/helpers";
import {
  GIT_BRANCH_QUERY_KEY,
  IDE_PAGE_PATH,
  IDE_PATH,
} from "../../constants/routes";
import { APP_MODE } from "../../entities/App";
import type { RouteComponentProps } from "react-router";
import { matchPath } from "react-router";

type Props = {
  initEditor: (payload: InitializeEditorPayload) => void;
} & RouteComponentProps<{ pageId: string }>;

class IDELoader extends React.PureComponent<Props, { Page: any }> {
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
    } = this.props;
    const branch = getSearchQuery(search, GIT_BRANCH_QUERY_KEY);

    const matchParams = matchPath<{ appId: string; pageId: string }>(
      window.location.pathname,
      {
        path: [IDE_PATH, IDE_PAGE_PATH],
      },
    );

    if (matchParams) {
      const { appId, pageId } = matchParams.params;
      if (appId) {
        initEditor({
          applicationId: appId,
          pageId,
          branch,
          mode: APP_MODE.EDIT,
        });
      }
    }
  }

  componentDidMount() {
    this.initialise();
    retryPromise(() => import(/* webpackChunkName: "ide" */ "./index")).then(
      (module) => {
        this.setState({ Page: module.default });
      },
    );
  }
  render() {
    const { Page } = this.state;
    return Page ? <Page {...this.props} /> : <PageLoadingBar />;
  }
}

const mapDispatchToProps = (dispatch: any) => {
  return {
    initEditor: (payload: InitializeEditorPayload) =>
      dispatch(initEditor(payload)),
  };
};

export default connect(null, mapDispatchToProps)(IDELoader);
