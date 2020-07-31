import React, { lazy, Suspense } from "react";
import Loader from "pages/common/Loader";

const Page = lazy(() => import(/* webpackChunkName: "Editor" */ "./index"));
const loadingIndicator = <Loader />;

class EditorLoader extends React.PureComponent {
  render() {
    return (
      <Suspense fallback={loadingIndicator}>
        <Page />
      </Suspense>
    );
  }
}

export default EditorLoader;
