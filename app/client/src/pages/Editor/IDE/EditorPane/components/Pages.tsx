import React from "react";
import { useSelector } from "react-redux";

import { default as OldPages } from "pages/Editor/Explorer/Pages";
import { PagesSection } from "../PagesSection";
import {
  getIsSideBySideEnabled,
  getPagesActiveStatus,
} from "selectors/ideSelectors";
import { useGetPageFocusUrls } from "../../hooks";

const Pages = () => {
  const isSideBySideEnabled = useSelector(getIsSideBySideEnabled);
  const pagesActive = useSelector(getPagesActiveStatus);
  const pageFocusUrls = useGetPageFocusUrls();

  if (!isSideBySideEnabled) {
    return <OldPages />;
    /* divider is inside the Pages component */
  } else if (isSideBySideEnabled && pagesActive) {
    return <PagesSection pageFocusUrls={pageFocusUrls} />;
  } else {
    return null;
  }
};

export { Pages };
