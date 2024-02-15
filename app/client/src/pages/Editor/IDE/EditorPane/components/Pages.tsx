import React from "react";
import { useSelector } from "react-redux";
import { default as OldPages } from "pages/Editor/Explorer/Pages";
import { PagesSection } from "../PagesSection";
import { getIsSideBySideEnabled } from "selectors/ideSelectors";

const Pages = () => {
  const isSideBySideEnabled = useSelector(getIsSideBySideEnabled);

  if (!isSideBySideEnabled) {
    return <OldPages />;
  } else {
    return <PagesSection />;
  }
};

export { Pages };
