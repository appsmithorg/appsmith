import React from "react";
import { IDEHeaderSwitcher } from "@appsmith/ads";

import { createMessage, HEADER_TITLES } from "ee/constants/messages";
import { PagesSection } from "../EditorPane/PagesSection";
import { useBoolean } from "usehooks-ts";
import { useSelector } from "react-redux";
import { getCurrentPageId, getPageById } from "selectors/editorSelectors";

const EditorTitle = () => {
  const {
    setFalse: setMenuClose,
    setValue: setMenuState,
    value: isMenuOpen,
  } = useBoolean(false);

  const pageId = useSelector(getCurrentPageId) as string;
  const currentPage = useSelector(getPageById(pageId));

  if (!currentPage) return null;

  return (
    <IDEHeaderSwitcher
      active={isMenuOpen}
      prefix={createMessage(HEADER_TITLES.PAGES)}
      setActive={setMenuState}
      title={currentPage.pageName}
      titleTestId="t--pages-switcher"
    >
      <PagesSection onItemSelected={setMenuClose} />
    </IDEHeaderSwitcher>
  );
};

export { EditorTitle };
