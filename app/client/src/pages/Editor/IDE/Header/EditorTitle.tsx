import React, { useCallback, useState } from "react";
import { IDEHeaderSwitcher } from "@appsmith/ads";

import { createMessage, HEADER_TITLES } from "ee/constants/messages";
import { PagesSection } from "../EditorPane/PagesSection";

const EditorTitle = ({ title }: { title: string }) => {
  const [active, setActive] = useState(false);

  const closeMenu = useCallback(() => {
    setActive(false);
  }, []);

  return (
    <IDEHeaderSwitcher
      active={active}
      prefix={createMessage(HEADER_TITLES.PAGES)}
      setActive={setActive}
      title={title}
      titleTestId="t--pages-switcher"
    >
      <PagesSection onItemSelected={closeMenu} />
    </IDEHeaderSwitcher>
  );
};

export { EditorTitle };
