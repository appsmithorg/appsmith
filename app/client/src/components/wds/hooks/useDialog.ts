import React, { useCallback, useEffect } from "react";

const noop = () => null;

function visible(el: HTMLInputElement) {
  return (
    !el.hidden &&
    (!el.type || el.type !== "hidden") &&
    (el.offsetWidth > 0 || el.offsetHeight > 0)
  );
}

function focusable(el: Element) {
  const inputEl = el as HTMLInputElement;
  return inputEl.tabIndex >= 0 && !inputEl.disabled && visible(inputEl);
}

type UseDialogParameters = {
  modalRef: React.RefObject<HTMLElement>;
  overlayRef: React.RefObject<HTMLElement>;
  isOpen?: boolean;
  onDismiss?: () => void;
  initialFocusRef?: React.RefObject<HTMLElement>;
  closeButtonRef?: React.RefObject<HTMLElement>;
  returnFocusRef?: React.RefObject<HTMLElement>;
};

function useDialog({
  modalRef,
  overlayRef,
  isOpen,
  onDismiss = noop,
  initialFocusRef,
  closeButtonRef,
}: UseDialogParameters) {
  const onClickOutside = useCallback(
    (e) => {
      if (
        modalRef.current &&
        overlayRef.current &&
        !modalRef.current.contains(e.target) &&
        overlayRef.current.contains(e.target)
      ) {
        onDismiss();
      }
    },
    [onDismiss, modalRef, overlayRef],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("click", onClickOutside);
      return () => {
        document.removeEventListener("click", onClickOutside);
      };
    }
  }, [isOpen, onClickOutside]);

  useEffect(() => {
    if (isOpen) {
      if (initialFocusRef && initialFocusRef.current) {
        initialFocusRef.current.focus();
      } else if (closeButtonRef && closeButtonRef.current) {
        closeButtonRef.current.focus();
      }
    }
  }, [isOpen, initialFocusRef, closeButtonRef]);

  const getFocusableItem = useCallback(
    (e: Event, movement: number) => {
      if (modalRef.current) {
        const items = Array.from(modalRef.current.querySelectorAll("*")).filter(
          focusable,
        );
        if (items.length === 0) return;
        e.preventDefault();
        const focusedElement = document.activeElement;
        if (!focusedElement) {
          return;
        }

        const index = items.indexOf(focusedElement);
        const offsetIndex = index + movement;
        const fallbackIndex = movement === 1 ? 0 : items.length - 1;
        const focusableItem = items[offsetIndex] || items[fallbackIndex];
        return focusableItem as HTMLElement;
      }
    },
    [modalRef],
  );

  const handleTab = useCallback(
    (e) => {
      const movement = e.shiftKey ? -1 : 1;
      const focusableItem = getFocusableItem(e, movement);
      if (!focusableItem) {
        return;
      }

      focusableItem.focus();
    },
    [getFocusableItem],
  );

  const onKeyDown = useCallback(
    (event) => {
      switch (event.key) {
        case "Tab":
          handleTab(event);
          break;
        case "Escape":
          onDismiss();
          event.stopPropagation();
          break;
      }
    },
    [handleTab, onDismiss],
  );

  const getDialogProps = () => {
    return { onKeyDown };
  };

  return { getDialogProps };
}

export { useDialog };
