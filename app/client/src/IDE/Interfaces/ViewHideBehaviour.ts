/**
 * Close:
 *  - View is not visible at all
 *  - View is not interactable till opened again
 *
 * Collapse:
 *  - View is visible but can not be resized
 *  - Top part of the view is visible with open to reopen it
 *  - Children can have extra view that changes when hidden that can have different behaviours
 */
export enum ViewHideBehaviour {
  CLOSE = "CLOSE",
  COLLAPSE = "COLLAPSE",
}
