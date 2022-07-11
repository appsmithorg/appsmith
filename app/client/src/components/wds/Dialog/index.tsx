import React, {
  forwardRef,
  PropsWithChildren,
  useContext,
  useRef,
} from "react";
import {
  useDialog,
  useOnEscapePress,
  useOnOutsideClick,
  useProvidedRefOrCreate,
  useProvidedStateOrCreate,
} from "../hooks";
import { ComponentProps } from "../utils/types";
import { useCombinedRefs } from "../hooks/useCombinedRefs";

import styles from "./styles.module.css";
import Button, { ButtonProps } from "../Button";
import { useFocusTrap } from "../hooks/useFocusTrap";
import { useOnClickOutside } from "utils/hooks/useOnClickOutside";

const noop = () => null;

/* -------------------------------------------------------------------------------------------------
 * Dialog
 * -----------------------------------------------------------------------------------------------*/
type DialogContextProps = {
  isOpen?: boolean;
  onOpen(): void;
  onClose(): void;
  onOpenChange?(open: boolean): void;
  initialFocusRef?: React.RefObject<HTMLElement>;
  anchorRef?: React.RefObject<HTMLElement>;
  children?: JSX.Element | JSX.Element[];
};

const DialogContext = React.createContext<DialogContextProps>({
  isOpen: false,
  onOpen: noop,
  onClose: noop,
});

export type DialogProps = Pick<
  DialogContextProps,
  "children" | "isOpen" | "onOpenChange" | "anchorRef"
>;

const Dialog: React.FC<DialogProps> = ({
  anchorRef: providedAnchorRef,
  children,
  isOpen,
  onOpenChange,
}: DialogProps) => {
  const [combinedOpenState, setCombinedOpenState] = useProvidedStateOrCreate(
    isOpen,
    onOpenChange,
    false,
  );
  const onOpen = React.useCallback(() => setCombinedOpenState(true), [
    setCombinedOpenState,
  ]);
  const onClose = React.useCallback(() => setCombinedOpenState(false), [
    setCombinedOpenState,
  ]);

  // on click of dialog trigger button or anchor
  const onAnchorClick = React.useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if (event.defaultPrevented || event.button !== 0) {
        return;
      }
      if (!combinedOpenState) {
        onOpen();
      } else {
        onClose();
      }
    },
    [combinedOpenState, onOpen, onClose],
  );

  const anchorRef = useProvidedRefOrCreate(providedAnchorRef);

  // 🚨 Hack for good API!
  // we strip out Anchor from children and pass it to AnchoredOverlay to render
  // with additional props for accessibility
  const contents = React.Children.map(children, (child: any) => {
    if (child.type === DialogButton) {
      return React.cloneElement(child, {
        onClick: onAnchorClick,
      });
    }
    return child;
  });

  return (
    <DialogContext.Provider
      value={{
        anchorRef,
        isOpen: combinedOpenState,
        onOpen,
        onClose,
      }}
    >
      {contents}
    </DialogContext.Provider>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Dialog Triggers
 * -----------------------------------------------------------------------------------------------*/

export type DialogAnchorProps = { children: React.ReactElement };

const Anchor = React.forwardRef<
  React.RefObject<HTMLElement>,
  DialogAnchorProps
>(({ children, ...anchorProps }, anchorRef) => {
  return React.cloneElement(children, { ...anchorProps, ref: anchorRef });
});

const DialogButton = React.forwardRef<
  React.RefObject<HTMLElement>,
  ButtonProps
>((props, anchorRef) => {
  return (
    <Anchor ref={anchorRef}>
      <Button {...props} />
    </Anchor>
  );
});

/* -------------------------------------------------------------------------------------------------
 * Dialog Content
 * -----------------------------------------------------------------------------------------------*/

type DialogContentProps = {
  initialFocusRef?: React.RefObject<HTMLElement>;
  returnFocusRef?: React.RefObject<HTMLElement>;
  children?: JSX.Element | JSX.Element[];
};

const DialogContent = forwardRef<HTMLDivElement, DialogContentProps>(
  ({ children, initialFocusRef, returnFocusRef, ...props }, forwardedRef) => {
    const context = useContext(DialogContext);
    const overlayRef = useRef(null);
    const modalRef = useCombinedRefs(forwardedRef);
    const closeButtonRef = useRef(null);

    const onCloseClick = () => {
      context.onClose();
      if (returnFocusRef && returnFocusRef.current) {
        returnFocusRef.current.focus();
      }
    };

    useFocusTrap({
      containerRef: modalRef,
      disabled: !context.isOpen,
      restoreFocusOnCleanUp: true,
      initialFocusRef: initialFocusRef,
    });

    useOnEscapePress(context.onClose);

    useOnOutsideClick({
      containerRef: modalRef,
      onClickOutside: context.onClose,
    });

    return context.isOpen ? (
      <>
        <span className={styles.overlay} ref={overlayRef} />
        <div
          aria-modal="true"
          className={styles.base}
          ref={modalRef}
          role="dialog"
          tabIndex={-1}
          {...props}
        >
          <button onClick={onCloseClick} ref={closeButtonRef} />
          {children}
        </div>
      </>
    ) : null;
  },
);

Dialog.displayName = "Dialog";

// export type DialogProps = ComponentProps<typeof Dialog>;
export default Object.assign(Dialog, {
  Button: DialogButton,
  Anchor,
  Content: DialogContent,
});
