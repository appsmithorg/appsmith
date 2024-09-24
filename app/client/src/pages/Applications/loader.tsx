import React from "react";
import PageLoadingBar from "pages/common/PageLoadingBar";
import { retryPromise } from "utils/AppsmithUtils";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { connect } from "react-redux";
import { showDebugger } from "actions/debuggerActions";

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
class ApplicationListLoader extends React.PureComponent<any, { Page: any }> {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(props: any) {
    super(props);

    this.state = {
      Page: null,
    };
  }

  componentDidMount() {
    //Close debugger call is required because if we import the application page with debugger open
    //it will cause a debugger to open. issue #21xxx
    this.props.closeDebugger();
    AnalyticsUtil.logEvent("APPLICATIONS_PAGE_LOAD");
    retryPromise(
      async () =>
        import(
          /* webpackChunkName: "applications" */ "ee/pages/Applications/index"
        ),
    ).then((module) => {
      this.setState({ Page: module.default });
    });
  }

  render() {
    const { Page } = this.state;

    return Page ? <Page {...this.props} /> : <PageLoadingBar />;
  }
}

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapDispatchToProps = (dispatch: any) => ({
  closeDebugger: () => dispatch(showDebugger(false)),
});

export default connect(null, mapDispatchToProps)(ApplicationListLoader);
