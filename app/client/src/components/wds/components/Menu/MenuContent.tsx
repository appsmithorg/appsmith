import * as React from "react";
import {
  useMergeRefs,
  FloatingPortal,
  FloatingFocusManager,
} from "@floating-ui/react";
import { useMenuContext } from "./MenuContext";

export const MenuContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLProps<HTMLDivElement>
>(function MenuContent({ children, ...props }, propRef) {
  const context = useMenuContext();
  console.log({ context });
  const { context: floatingContext } = context;
  const nested = context.nested;

  context.listContentRef.current = React.Children.map(children, (child) =>
    React.isValidElement(child) ? child.props.label : null,
  ) as Array<string | null>;

  return (
    <FloatingPortal>
      {context.open && (
        <FloatingFocusManager
          context={floatingContext}
          // Prevent outside content interference.
          initialFocus={nested ? -1 : 0}
          // Only initially focus the root floating menu.
          modal={!nested}
          // Only return focus to the root menu's reference when menus close.
          returnFocus={!nested}
          // Allow touch screen readers to escape the modal root menu
          // without selecting anything.
          visuallyHiddenDismiss
        >
          <div
            className="Menu"
            ref={context.refs.setFloating}
            style={{
              position: context.strategy,
              top: context.y ?? 0,
              left: context.x ?? 0,
              width: "max-content",
            }}
            {...context.getFloatingProps({
              // Pressing tab dismisses the menu due to the modal
              // focus management on the root menu.
              onKeyDown(event) {
                if (event.key === "Tab") {
                  context.setOpen(false);
                }
              },
            })}
          >
            {React.Children.map(
              children,
              (child, index) =>
                React.isValidElement(child) &&
                React.cloneElement(
                  child,
                  context.getItemProps({
                    tabIndex: context.activeIndex === index ? 0 : -1,
                    role: "menuitem",
                    className: "MenuItem",
                    ref(node: HTMLButtonElement) {
                      context.listItemsRef.current[index] = node;
                    },
                    onClick(event) {
                      console.log({ event, context, tree: context.tree });
                      child.props.onClick?.(event);
                      context.tree?.events.emit("click");
                    },
                    // Allow focus synchronization if the cursor did not move.
                    onMouseEnter() {
                      if (context.allowHover && context.open) {
                        context.setActiveIndex(index);
                      }
                    },
                  }),
                ),
            )}
          </div>
        </FloatingFocusManager>
      )}
    </FloatingPortal>
  );
});
