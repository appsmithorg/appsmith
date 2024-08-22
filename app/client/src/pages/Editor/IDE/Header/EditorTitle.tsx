import React, { useState } from "react";

import { IDEHeaderEditorSwitcher } from "IDE";
import { HEADER_TITLES, createMessage } from "ee/constants/messages";

import { Popover, PopoverContent, PopoverTrigger } from "@appsmith/ads";

import { PagesSection } from "../EditorPane/PagesSection";

const EditorTitle = ({ title }: { title: string }) => {
  const [active, setActive] = useState(false);

  const closeMenu = () => {
    setActive(false);
  };

  return (
    <Popover onOpenChange={setActive} open={active}>
      <PopoverTrigger>
        <IDEHeaderEditorSwitcher
          active={active}
          prefix={createMessage(HEADER_TITLES.EDITOR)}
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
