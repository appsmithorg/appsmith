import React, { useCallback, useEffect, useRef, useState } from "react";
import { getMainCanvas } from "./WidgetUtils";
import styled from "styled-components";
import { BaseSelectRef } from "rc-select";
import { RenderMode, RenderModes } from "constants/WidgetConstants";

const BackDropContainer = styled.div`
  position: fixed;
  width: 100vw;
  height: 100vh;
  background: transparent;
  top: 0;
  left: 0;
  display: none;
`;

type useDropdownProps = {
  inputRef: React.RefObject<HTMLInputElement>;
  renderMode?: RenderMode;
  onDropdownOpen?: () => void;
  onDropdownClose?: () => void;
};
const FOCUS_TIMEOUT = 500;

// TODO: Refactor More functionalities in MultiSelect, MultiTreeSelect and TreeSelect Components
const useDropdown = ({
  inputRef,
  onDropdownClose,
  onDropdownOpen,
  renderMode,
}: useDropdownProps) => {
  // This is to make the dropdown controlled
  const [isOpen, setIsOpen] = useState(false);
  const popupContainer = useRef<HTMLElement>(getMainCanvas());
  const selectRef = useRef<BaseSelectRef | null>(null);

  useEffect(() => {
    if (!popupContainer.current) {
      popupContainer.current = getMainCanvas();
    }
  }, []);

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    // Backspace would simultaneously remove an option, so it should only be used within the search input
    if (event.key === "Backspace") {
      event.stopPropagation();
    }
  };

  // Avoid scrolls when Popup is opened
  function BackDrop() {
    return <BackDropContainer onClick={closeBackDrop} />;
  }
  // Get PopupContainer on main Canvas
  const getPopupContainer = useCallback(() => popupContainer.current, []);

  const handleOnDropdownOpen = useCallback(() => {
    if (!isOpen && onDropdownOpen) {
      onDropdownOpen();
    }
  }, [onDropdownOpen, isOpen]);

  const handleOnDropdownClose = useCallback(() => {
    if (isOpen && onDropdownClose) {
      onDropdownClose();
    }
  }, [onDropdownClose, isOpen]);

  // When Dropdown is opened disable scrolling within the app except the list of options
  const onOpen = useCallback(
    (open: boolean) => {
      setIsOpen(open);
      if (open) {
        handleOnDropdownOpen();
        setTimeout(() => inputRef.current?.focus(), FOCUS_TIMEOUT);
        // for more context, the Element we attach to in view mode doesn't have an overflow style, so this only applies to edit mode.
        if (popupContainer.current && renderMode === RenderModes.CANVAS) {
          popupContainer.current.style.overflowY = "hidden";
        }
      } else {
        handleOnDropdownClose();
        if (popupContainer.current && renderMode === RenderModes.CANVAS) {
          popupContainer.current.style.overflowY = "auto";
        }
        selectRef.current?.blur();
      }
    },
    [renderMode, handleOnDropdownOpen, handleOnDropdownOpen],
  );

  const closeBackDrop = useCallback(() => {
    if (selectRef.current) {
      selectRef.current.blur();
      onOpen(false);
    }
  }, [onOpen]);

  return {
    BackDrop,
    getPopupContainer,
    onOpen,
    isOpen,
    selectRef,
    onKeyDown,
  };
};

export default useDropdown;
