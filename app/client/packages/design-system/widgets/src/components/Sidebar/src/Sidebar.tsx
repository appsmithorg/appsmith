import clsx from "clsx";
import * as React from "react";
import { type Ref, useRef } from "react";
import { Sheet } from "../../Sheet";
import { useSidebar } from "./use-sidebar";
import styles from "./styles.module.css";
import type { SidebarProps } from "./types";
import { CSSTransition } from "react-transition-group";
import { SidebarContent } from "./SidebarContent";

const _Sidebar = (props: SidebarProps, ref: Ref<HTMLDivElement>) => {
  const {
    children,
    className,
    collapsible = "offcanvas",
    onEnter: onEnterProp,
    onEntered: onEnteredProp,
    onExit: onExitProp,
    onExited: onExitedProp,
    side = "start",
    title,
    variant = "sidebar",
    ...rest
  } = props;
  const [isAnimating, setIsAnimating] = React.useState(false);
  const { isMobile, setState, state } = useSidebar();
  const sidebarRef = useRef<HTMLDivElement>();

  const onEnter = () => {
    setIsAnimating(true);
    onEnterProp?.();
  };

  const onEntered = () => {
    setIsAnimating(false);
    onEnteredProp?.();
  };

  const onExit = () => {
    setIsAnimating(true);
    onExitProp?.();
  };

  const onExited = () => {
    setIsAnimating(false);
    onExitedProp?.();
  };

  const content = (
    <SidebarContent title={title}>
      {typeof children === "function"
        ? children({ isAnimating, state })
        : children}
    </SidebarContent>
  );

  if (collapsible === "none") {
    return (
      <div className={clsx(className)} ref={ref} {...props}>
        {content}
      </div>
    );
  }

  if (Boolean(isMobile)) {
    return (
      <Sheet
        isOpen={state === "expanded"}
        onEnter={onEnter}
        onEntered={onEntered}
        onExit={onExit}
        onExited={onExited}
        onOpenChange={(isOpen) => setState(isOpen ? "expanded" : "collapsed")}
        position={side}
      >
        {content}
      </Sheet>
    );
  }

  return (
    <CSSTransition
      in={state === "full-width"}
      nodeRef={sidebarRef}
      onEnter={onEnter}
      onEntered={onEntered}
      onExit={onExit}
      onExited={onExited}
      timeout={300}
    >
      <CSSTransition
        in={state === "expanded"}
        nodeRef={sidebarRef}
        onEnter={onEnter}
        onEntered={onEntered}
        onExit={onExit}
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
            <div className={styles.sidebarContainer}>{content}</div>
          </div>
        </div>
      </CSSTransition>
    </CSSTransition>
  );
};

export const Sidebar = React.forwardRef(_Sidebar);
