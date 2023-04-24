import type { LegacyRef } from "react";
import React, { forwardRef } from "react";
import classNames from "classnames";
import { useSelector } from "react-redux";
import { previewModeSelector } from "selectors/editorSelectors";
import { Navigation } from "pages/AppViewer/Navigation";

const NavigationPreview = forwardRef(
  (
    props: { isAppSettingsPaneWithNavigationTabOpen?: boolean },
    ref: LegacyRef<HTMLDivElement> | undefined,
  ) => {
    const { isAppSettingsPaneWithNavigationTabOpen } = props;
    const isPreviewMode = useSelector(previewModeSelector);

    return (
      <div
        className={classNames({
          "absolute top-0 z-3 w-full transform bg-gray-50 ease-in t--navigation-preview":
            true,
          "translate-y-0 ease-in transition duration-300":
            isPreviewMode || isAppSettingsPaneWithNavigationTabOpen,
          "-translate-y-full duration-0":
            !isPreviewMode || !isAppSettingsPaneWithNavigationTabOpen,
        })}
        ref={ref}
      >
        <Navigation />
      </div>
    );
  },
);

export default NavigationPreview;
