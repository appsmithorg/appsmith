import React, { useState } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  IDEHeaderSwitcher,
} from "@appsmith/ads";

import { createMessage, HEADER_TITLES } from "ee/constants/messages";
import { PagesSection } from "../EditorPane/PagesSection";

const EditorTitle = ({ title }: { title: string }) => {
  const [active, setActive] = useState(false);

  const closeMenu = () => {
    setActive(false);
  };

  return (
    <Popover onOpenChange={setActive} open={active}>
      <PopoverTrigger>
        <IDEHeaderSwitcher
          active={active}
          prefix={createMessage(HEADER_TITLES.PAGES)}
          title={title}
          titleTestId="t--pages-switcher"
        />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="!p-0 !pb-1"
        onEscapeKeyDown={closeMenu}
      >
        <PagesSection onItemSelected={closeMenu} />
      </PopoverContent>
    </Popover>
  );
};

export { EditorTitle };
