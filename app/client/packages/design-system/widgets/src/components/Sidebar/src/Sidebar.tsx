import clsx from "clsx";
import * as React from "react";
import { type Ref, useRef } from "react";
import { Sheet } from "../../Sheet";
import { useSidebar } from "./use-sidebar";
import styles from "./styles.module.css";
import type { SidebarProps } from "./types";
import { CSSTransition } from "react-transition-group";

const _Sidebar = (props: SidebarProps, ref: Ref<HTMLDivElement>) => {
  const {
    children,
    className,
    collapsible = "offcanvas",
    onEntered,
    onExited,
    side = "start",
    variant = "sidebar",
    ...rest
  } = props;
  const { isMobile, setOpen, state } = useSidebar();
  const sidebarRef = useRef<HTMLDivElement>();

  if (collapsible === "none") {
    return (
      <div className={clsx(className)} ref={ref} {...props}>
        {children}
      </div>
    );
  }

  if (Boolean(isMobile)) {
    return (
      <Sheet
        isOpen={state === "expanded"}
        onEntered={onEntered}
        onExited={onExited}
        onOpenChange={setOpen}
        position={side}
      >
        {children}
      </Sheet>
    );
  }

  return (
    <CSSTransition
      in={state === "expanded"}
      nodeRef={sidebarRef}
      onEntered={onEntered}
      onExited={onExited}
      timeout={300}
    >
      <div
        className={clsx(styles.mainSidebar)}
        data-collapsible={state === "collapsed" ? collapsible : ""}
        data-side={side}
        data-state={state}
        data-variant={variant}
        // @ts-expect-error TS is unable to infer the correct type for the render prop
        ref={sidebarRef}
      >
        <div className={styles.fakeSidebar} />
        <div className={clsx(styles.sidebar, className)} ref={ref} {...rest}>
          <div className={styles.sidebarContainer}>{children}</div>
        </div>
      </div>
    </CSSTransition>
  );
};

export const Sidebar = React.forwardRef(_Sidebar);
