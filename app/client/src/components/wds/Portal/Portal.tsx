import React, { useLayoutEffect } from "react";
import { createPortal } from "react-dom";

const PRIMER_PORTAL_ROOT_ID = "__primerPortalRoot__";
const DEFAULT_PORTAL_CONTAINER_NAME = "__default__";

const portalRootRegistry: Partial<Record<string, Element>> = {};

/**
 * Register a container to serve as a portal root.
 * @param root The element that will be the root for portals created in this container
 * @param name The name of the container, to be used with the `containerName` prop on the Portal Component.
 * If name is not specified, registers the default portal root.
 */
export function registerPortalRoot(
  root: Element,
  name = DEFAULT_PORTAL_CONTAINER_NAME,
): void {
  portalRootRegistry[name] = root;
}

// Ensures that a default portal root exists and is registered. If a DOM element exists
// with id __primerPortalRoot__, allow that element to serve as the default portal root.
// Otherwise, create that element and attach it to the end of document.body.
function ensureDefaultPortal() {
  const existingDefaultPortalContainer =
    portalRootRegistry[DEFAULT_PORTAL_CONTAINER_NAME];
  if (
    !existingDefaultPortalContainer ||
    !document.body.contains(existingDefaultPortalContainer)
  ) {
    let defaultPortalContainer = document.getElementById(PRIMER_PORTAL_ROOT_ID);
    if (!(defaultPortalContainer instanceof Element)) {
      defaultPortalContainer = document.createElement("div");
      defaultPortalContainer.setAttribute("id", PRIMER_PORTAL_ROOT_ID);
      defaultPortalContainer.style.position = "absolute";
      defaultPortalContainer.style.top = "0";
      defaultPortalContainer.style.left = "0";
      const suitablePortalRoot = document.querySelector("[data-portal-root]");
      if (suitablePortalRoot) {
        suitablePortalRoot.appendChild(defaultPortalContainer);
      } else {
        document.body.appendChild(defaultPortalContainer);
      }
    }

    registerPortalRoot(defaultPortalContainer);
  }
}

export interface PortalProps {
  /**
   * Called when this portal is added to the DOM
   */
  onMount?: () => void;

  /**
   * Optional. Mount this portal at the container specified
   * by this name. The container must be previously registered
   * with `registerPortal`.
   */
  containerName?: string;
}

/**
 * Creates a React Portal, placing all children in a separate physical DOM root node.
 * @see https://reactjs.org/docs/portals.html
 */
export const Portal: React.FC<PortalProps> = ({
  children,
  containerName: _containerName,
  onMount,
}) => {
  const hostElement = document.createElement("div");

  // Portaled content should get their own stacking context so they don't interfere
  // with each other in unexpected ways. One should never find themselves tempted
  // to change the zIndex to a value other than "1".
  hostElement.style.position = "relative";
  hostElement.style.zIndex = "1";
  const elementRef = React.useRef(hostElement);

  useLayoutEffect(() => {
    let containerName = _containerName;
    if (containerName === undefined) {
      containerName = DEFAULT_PORTAL_CONTAINER_NAME;
      ensureDefaultPortal();
    }
    const parentElement = portalRootRegistry[containerName];

    if (!parentElement) {
      throw new Error(
        `Portal container '${_containerName}' is not yet registered. Container must be registered with registerPortal before use.`,
      );
    }
    const element = elementRef.current;
    parentElement.appendChild(element);
    onMount?.();

    return () => {
      parentElement.removeChild(element);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elementRef]);

  return createPortal(children, elementRef.current);
};
