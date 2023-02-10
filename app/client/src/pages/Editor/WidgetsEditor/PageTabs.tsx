import React from "react";
import classNames from "classnames";
import { useSelector } from "react-redux";
import { previewModeSelector } from "selectors/editorSelectors";
import { Navigation } from "pages/AppViewer/Navigation";

function PageTabs(props: { isAppSettingsPaneWithNavigationTabOpen?: boolean }) {
  const { isAppSettingsPaneWithNavigationTabOpen } = props;
  const isPreviewMode = useSelector(previewModeSelector);

  return (
    <div
      className={classNames({
        "absolute top-0 z-1 w-full transform bg-gray-50 ease-in": true,
        "translate-y-0 ease-in transition duration-300":
          isPreviewMode || isAppSettingsPaneWithNavigationTabOpen,
        "-translate-y-full duration-0":
          !isPreviewMode || !isAppSettingsPaneWithNavigationTabOpen,
      })}
    >
      <Navigation />
    </div>
  );
}

export default PageTabs;
