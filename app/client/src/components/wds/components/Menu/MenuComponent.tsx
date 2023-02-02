import * as React from "react";
import {
  useFloating,
  offset,
  flip,
  shift,
  useListNavigation,
  useHover,
  useTypeahead,
  useInteractions,
  useRole,
  useClick,
  useDismiss,
  autoUpdate,
  safePolygon,
  FloatingPortal,
  useFloatingTree,
  useFloatingNodeId,
  useFloatingParentNodeId,
  useMergeRefs,
  FloatingNode,
  FloatingFocusManager,
} from "@floating-ui/react";

export interface MenuProps {
  label: string;
  nested?: boolean;
  children?: React.ReactNode;
}

export const MenuComponent = React.forwardRef<
  HTMLButtonElement,
  MenuProps & React.HTMLProps<HTMLButtonElement>
>(({ children, label, ...props }, forwardedRef) => {
  const [open, setOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);
  const [allowHover, setAllowHover] = React.useState(false);

  const listItemsRef = React.useRef<Array<HTMLButtonElement | null>>([]);
  const listContentRef = React.useRef(
    React.Children.map(children, (child) =>
      React.isValidElement(child) ? child.props.children : null,
    ) as Array<string | null>,
  );

  const tree = useFloatingTree();
  const nodeId = useFloatingNodeId();
  const parentId = useFloatingParentNodeId();
  const nested = parentId != null;

  const { context, refs, strategy, x, y } = useFloating<HTMLButtonElement>({
    open,
    nodeId,
    onOpenChange: setOpen,
    placement: nested ? "right-start" : "bottom-start",
    middleware: [
      offset({ mainAxis: 4, alignmentAxis: nested ? -5 : 0 }),
      flip(),
      shift(),
    ],
    whileElementsMounted: autoUpdate,
  });

  const { getFloatingProps, getItemProps, getReferenceProps } = useInteractions(
    [
      useHover(context, {
        handleClose: safePolygon({ restMs: 25 }),
        enabled: nested && allowHover,
        delay: { open: 75 },
      }),
      useClick(context, {
        toggle: !nested || !allowHover,
        event: "mousedown",
        ignoreMouse: nested,
      }),
      useRole(context, { role: "menu" }),
      useDismiss(context),
      useListNavigation(context, {
        listRef: listItemsRef,
        activeIndex,
        nested,
        onNavigate: setActiveIndex,
      }),
      useTypeahead(context, {
        listRef: listContentRef,
        onMatch: open ? setActiveIndex : undefined,
        activeIndex,
      }),
    ],
  );

  // Event emitter allows you to communicate across tree components.
  // This effect closes all menus when an item gets clicked anywhere
  // in the tree.
  React.useEffect(() => {
    function handleTreeClick() {
      setOpen(false);
    }

    function onSubMenuOpen(event: { nodeId: string; parentId: string }) {
      if (event.nodeId !== nodeId && event.parentId === parentId) {
        setOpen(false);
      }
    }

    tree?.events.on("click", handleTreeClick);
    tree?.events.on("menuopen", onSubMenuOpen);

    return () => {
      tree?.events.off("click", handleTreeClick);
      tree?.events.off("menuopen", onSubMenuOpen);
    };
  }, [tree, nodeId, parentId]);

  React.useEffect(() => {
    if (open) {
      tree?.events.emit("menuopen", {
        parentId,
        nodeId,
      });
    }
  }, [tree, open, nodeId, parentId]);

  // Determine if "hover" logic can run based on the modality of input. This
  // prevents unwanted focus synchronization as menus open and close with
  // keyboard navigation and the cursor is resting on the menu.
  React.useEffect(() => {
    function onPointerMove({ pointerType }: PointerEvent) {
      if (pointerType !== "touch") {
        setAllowHover(true);
      }
    }

    function onKeyDown() {
      setAllowHover(false);
    }

    window.addEventListener("pointermove", onPointerMove, {
      once: true,
      capture: true,
    });
    window.addEventListener("keydown", onKeyDown, true);
    return () => {
      window.removeEventListener("pointermove", onPointerMove, {
        capture: true,
      });
      window.removeEventListener("keydown", onKeyDown, true);
    };
  }, [allowHover]);

  const referenceRef = useMergeRefs([refs.setReference, forwardedRef]);

  return (
    <FloatingNode id={nodeId}>
      <button
        ref={referenceRef}
        {...getReferenceProps({
          ...props,
          className: `${nested ? "MenuItem" : "RootMenu"}${
            open ? " open" : ""
          }`,
          onClick(event) {
            event.stopPropagation();
          },
          ...(nested && {
            // Indicates this is a nested <Menu /> acting as a <MenuItem />.
            role: "menuitem",
          }),
        })}
      >
        {label}{" "}
        {nested && (
          <span aria-hidden style={{ marginLeft: 10 }}>
            ➔
          </span>
        )}
      </button>
      <FloatingPortal>
        {open && (
          <FloatingFocusManager
            context={context}
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
              ref={refs.setFloating}
              style={{
                position: strategy,
                top: y ?? 0,
                left: x ?? 0,
                width: "max-content",
              }}
              {...getFloatingProps({
                // Pressing tab dismisses the menu due to the modal
                // focus management on the root menu.
                onKeyDown(event) {
                  if (event.key === "Tab") {
                    setOpen(false);
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
                    getItemProps({
                      tabIndex: activeIndex === index ? 0 : -1,
                      role: "menuitem",
                      className: "MenuItem",
                      ref(node: HTMLButtonElement) {
                        listItemsRef.current[index] = node;
                      },
                      onClick(event) {
                        child.props.onClick?.(event);
                        tree?.events.emit("click");
                      },
                      // Allow focus synchronization if the cursor did not move.
                      onMouseEnter() {
                        if (allowHover && open) {
                          setActiveIndex(index);
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
