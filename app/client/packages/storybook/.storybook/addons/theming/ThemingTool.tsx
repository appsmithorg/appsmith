import * as React from "react";
import { memo, useState, useRef } from "react";
import { IconButton } from "@storybook/components";
import { Icon } from "@storybook/components/experimental";
import { ThemingPopup } from "./ThemingPopup";
import { createPortal } from "react-dom";

export const ThemingTool = memo(function MyAddonSelector() {
  const [isThemingPopupOpen, setThemingPopupOpen] = useState(false);
  const ref = useRef(null);

  const togglePopup = (e: Event) => {
    e.stopPropagation();

    if (ref.current === e.currentTarget && isThemingPopupOpen) {
      return setThemingPopupOpen(false);
    }

    return setThemingPopupOpen(!isThemingPopupOpen);
  };

  return (
    <>
      <IconButton
        key={"theming-tool"}
        active={isThemingPopupOpen}
        onClick={togglePopup}
        ref={ref}
      >
        <Icon.Lightning />
      </IconButton>
      {isThemingPopupOpen &&
        createPortal(
          <ThemingPopup
            leftShift={ref.current?.getBoundingClientRect().left}
            onClose={togglePopup}
          />,
          document.body,
        )}
    </>
  );
});
