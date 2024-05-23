/**
 * Close:
 *  - View is not visible at all
 *  - View is not interactable till opened again
 *
 * Collapse:
 *  - View is visible but cannot be resized
 *  - Top part of the view is visible with open to reopen it
 *  - Children can have extra view that changes when hidden that can have different behaviours
 */
export enum ViewHideBehaviour {
  CLOSE = "CLOSE",
  COLLAPSE = "COLLAPSE",
}

/**
 * OVERLAY:
 *  - Sets an absolute position to make the view render on top of other components
 *
 * BLOCK:
 *  - Sets a block position to make the view rendered next to other components
 */
export enum ViewDisplayMode {
  OVERLAY = "OVERLAY",
  BLOCK = "BLOCK",
}
