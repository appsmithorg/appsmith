import React from "react";

// import type { noop } from "lodash";

import type { MenuItemData } from "./NavigationMenuItem";
import { MenuTypes } from "./NavigationMenuItem";
import {
  MenuItem,
  MenuSub,
  MenuSubTrigger,
  MenuSubContent,
  MenuContent,
  MenuSeparator,
} from "design-system";

type NavigationMenuProps = {
  menuItems: MenuItemData[] | undefined;
  // setIsPopoverOpen: typeof noop;
};

export function NavigationMenu(props: NavigationMenuProps) {
  const { menuItems } = props;
  // const [confirm, setConfirm] = useState({
  //   isConfirm: false,
  //   text: "",
  // });
  // const handleReconfirmClick = (e: React.SyntheticEvent) => {
  //   if (!confirm.isConfirm && menuItems?men.confirmText) {
  //     setConfirm({
  //       isConfirm: true,
  //       text: confirmText,
  //     });
  //     e.preventDefault();
  //     e.stopPropagation();
  //   } else if (onClick) {
  //     // setIsPopoverOpen(false);
  //     onClick(e);
  //     AnalyticsUtil.logEvent("APP_MENU_OPTION_CLICK", {
  //       option: text,
  //     });
  //     setConfirm({
  //       isConfirm: false,
  //       text: text,
  //     });
  //   }
  // };
  return (
    <MenuContent width="214px">
      {menuItems?.map((item, idx) => {
        return item.type === MenuTypes.PARENT ? (
          <MenuSub>
            <MenuSubTrigger>{item.text}</MenuSubTrigger>
            <MenuSubContent width="214px">
              {item?.children?.map((subitem, idx) => (
                <MenuItem
                  endIcon={subitem?.isOpensNewWindow ? "share-box-line" : ""}
                  key={idx}
                  onClick={subitem.onClick}
                >
                  <div className="flex justify-between">
                    {subitem.text}
                    {subitem?.labelElement}
                  </div>
                </MenuItem>
              ))}
            </MenuSubContent>
          </MenuSub>
        ) : item.type === MenuTypes.MENU_DIVIDER ? (
          <MenuSeparator />
        ) : (
          <MenuItem key={idx} onClick={item.onClick}>
            {item.text}
          </MenuItem>
        );
      })}
    </MenuContent>
  );
}
