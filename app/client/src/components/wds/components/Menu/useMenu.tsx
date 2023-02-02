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

export function useMenu() {
  const [open, setOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);
  const [allowHover, setAllowHover] = React.useState(false);

  const listItemsRef = React.useRef<Array<HTMLButtonElement | null>>([]);
  const listContentRef = React.useRef([] as Array<string | null>);

  const tree = useFloatingTree();

  console.log({ tree });

  const nodeId = useFloatingNodeId();
  const parentId = useFloatingParentNodeId();
  const nested = parentId != null;

  const data = useFloating<HTMLButtonElement>({
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

  const context = data.context;
  const interactions = useInteractions([
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
  ]);

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

  return React.useMemo(
    () => ({
      open,
      setOpen,
      ...interactions,
      ...data,
      tree,
      nodeId,
      parentId,
      nested,
      listItemsRef,
      listContentRef,
      setAllowHover,
      allowHover,
      activeIndex,
      setActiveIndex,
    }),
    [
      open,
      setOpen,
      interactions,
      data,
      tree,
      nodeId,
      parentId,
      nested,
      listItemsRef,
      listContentRef,
      setAllowHover,
      allowHover,
      activeIndex,
      setActiveIndex,
    ],
  );
}
