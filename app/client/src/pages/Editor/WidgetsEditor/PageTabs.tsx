import React from "react";
import classNames from "classnames";
import { useSelector } from "react-redux";

import { getCurrentApplication } from "selectors/applicationSelectors";
import PageTabsContainer from "pages/AppViewer/viewer/PageTabsContainer";
import {
  getViewModePageList,
  previewModeSelector,
} from "selectors/editorSelectors";

function PageTabs() {
  const pages = useSelector(getViewModePageList);
  const isPreviewMode = useSelector(previewModeSelector);
  const currentApplicationDetails = useSelector(getCurrentApplication);

  return (
    <div
      className={classNames({
        "absolute top-0 z-1 w-full transform bg-gray-50 ease-in": true,
        "translate-y-0 ease-in transition duration-300": isPreviewMode,
        "-translate-y-full duration-0": !isPreviewMode,
      })}
    >
      <PageTabsContainer
        currentApplicationDetails={currentApplicationDetails}
        pages={pages}
      />
    </div>
  );
}

export default PageTabs;
