import React, { useCallback, useState } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@appsmith/ads";

import { createMessage, HEADER_TITLES } from "ee/constants/messages";
import { PagesSection } from "../EditorPane/PagesSection";
import { IDEHeaderEditorSwitcher } from "IDE";

const EditorTitle = ({ title }: { title: string }) => {
  const [active, setActive] = useState(false);

  const closeMenu = useCallback(() => {
    setActive(false);
  }, []);

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
