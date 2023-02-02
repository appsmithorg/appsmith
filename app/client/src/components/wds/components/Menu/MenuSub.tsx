import * as React from "react";
import {
  useMergeRefs,
  FloatingPortal,
  FloatingFocusManager,
  FloatingNode,
  useFloatingNodeId,
} from "@floating-ui/react";
import { useMenuContext } from "./MenuContext";

export const MenuSub = React.forwardRef<
  HTMLElement,
  React.HTMLProps<HTMLElement> & { label: string }
>(function MenuSub({ children, label, ...props }, propRef) {
  const context = useMenuContext();
  const { context: floatingContext } = context;
  const nodeId = useFloatingNodeId();

  context.listContentRef.current = React.Children.map(children, (child) =>
    React.isValidElement(child) ? child.props.label : null,
  ) as Array<string | null>;

  const ref = useMergeRefs([context.refs.setReference, propRef]);

  return (
    <FloatingNode id={nodeId}>
      <button
        ref={ref}
        {...context.getReferenceProps({
          ...props,
          className: `${"MenuItem"}${context.open ? " open" : ""}`,
          onClick(event) {
            event.stopPropagation();
          },
          role: "menuitem",
        })}
      >
        {label}
        <span aria-hidden style={{ marginLeft: 10 }}>
          ➔
        </span>
      </button>
      <FloatingPortal>
        {context.open && (
          <FloatingFocusManager
            context={floatingContext}
            // Prevent outside content interference.
            initialFocus={-1}
            // Only initially focus the root floating menu.
            modal={false}
            // Only return focus to the root menu's reference when menus close.
            returnFocus={false}
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
    </FloatingNode>
  );
});
