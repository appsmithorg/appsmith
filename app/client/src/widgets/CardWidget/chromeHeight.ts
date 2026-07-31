import { GridDefaults } from "constants/WidgetConstants";

import type { CardFooterAction } from "./constants";
import {
  CARD_FOOTER_HEIGHT,
  CARD_HEADER_HEIGHT,
  DEFAULT_MEDIA_HEIGHT,
  MediaPositionTypes,
} from "./constants";

/**
 * The Card's chrome (media + header + footer + borders) is reserved by two
 * callers that see the same widget from different angles:
 *
 * 1. `CardWidget.getMethods().getCanvasHeightOffset` — called by the auto height
 *    sagas with raw props from the canvas widgets reducer. Bindings are NOT
 *    evaluated there, so a property can be the literal string "{{...}}", and
 *    meta properties (`isExpanded`) are absent entirely.
 * 2. `CardWidget.getChromeHeight` — called during render with evaluated props.
 *
 * Both go through this one function so the space the saga reserves always
 * matches the space the component paints. The two previously encoded the same
 * model with different predicates and drifted, which clipped or gapped the card
 * body. Keep every caller on this function rather than re-deriving chrome.
 */

/**
 * True when a value is still an unevaluated binding. Only reachable on the
 * saga/DSL path — evaluated props never contain binding syntax — so the
 * render path behaves exactly as if these branches did not exist.
 */
function isUnresolvedBinding(value: unknown): boolean {
  return typeof value === "string" && value.includes("{{");
}

/**
 * Chrome zones are opt-out: the component renders the header when
 * `showHeader !== false`, so reserving on anything other than an explicit
 * `false` is what keeps the two in agreement.
 */
function isZoneShown(value: unknown): boolean {
  return value !== false;
}

/**
 * A footer action is rendered only when `isVisible` is exactly `true` (see
 * `CardWidget.getVisibleFooterActions`). An unevaluated binding may resolve
 * either way, so reserve the footer rather than risk clipping the body — a
 * temporary gap is recoverable, clipped content is not.
 */
function isFooterActionShown(action: CardFooterAction): boolean {
  return action?.isVisible === true || isUnresolvedBinding(action?.isVisible);
}

/**
 * `isExpanded` is a meta property, so it is absent from the DSL the sagas read.
 * `defaultExpanded` is a real persisted property and carries the same state on
 * page load, so fall back to it before assuming the card is expanded.
 */
function isExpanded(props: CardChromeProps): boolean {
  if (!props.expandCollapseEnabled) return true;

  const expanded = props.isExpanded ?? props.defaultExpanded;

  return expanded !== false;
}

/**
 * Only TOP media occupies vertical space; LEFT media occupies width. An
 * unevaluated `mediaPosition` binding is treated as TOP so the media height is
 * still reserved.
 */
function hasTopMedia(props: CardChromeProps): boolean {
  const isTop =
    props.mediaPosition === MediaPositionTypes.TOP ||
    isUnresolvedBinding(props.mediaPosition);

  return isTop && Boolean(props.mediaImage);
}

/** Props consumed from either evaluated widget props or the raw DSL. */
export interface CardChromeProps {
  showHeader?: unknown;
  showFooter?: unknown;
  expandCollapseEnabled?: unknown;
  isExpanded?: unknown;
  defaultExpanded?: unknown;
  footerActions?: Record<string, CardFooterAction>;
  mediaPosition?: unknown;
  mediaImage?: unknown;
  mediaHeight?: unknown;
  borderWidth?: unknown;
}

/**
 * Total chrome height in pixels. Never negative, never NaN — `mediaHeight` and
 * `borderWidth` are both bindable and can arrive as arbitrary strings.
 */
export function getCardChromeHeightInPx(props: CardChromeProps): number {
  let chromeHeightPx = 0;

  if (isZoneShown(props.showHeader)) {
    chromeHeightPx += CARD_HEADER_HEIGHT;
  }

  const hasVisibleFooterActions = Object.values(props.footerActions || {}).some(
    isFooterActionShown,
  );

  if (
    isZoneShown(props.showFooter) &&
    isExpanded(props) &&
    hasVisibleFooterActions
  ) {
    chromeHeightPx += CARD_FOOTER_HEIGHT;
  }

  // Clamp each term, not just the total: both values are bindable, and a
  // negative one would silently cancel out the header/footer chrome above,
  // under-reserving space and clipping the body — the exact failure this
  // module exists to prevent. Clamping the total alone would not catch it.
  if (hasTopMedia(props)) {
    chromeHeightPx += Math.max(
      0,
      Number(props.mediaHeight) || DEFAULT_MEDIA_HEIGHT,
    );
  }

  chromeHeightPx += 2 * Math.max(0, Number(props.borderWidth) || 0);

  return Math.max(0, chromeHeightPx);
}

/** Chrome height expressed in grid rows, as the auto height sagas expect. */
export function getCardChromeHeightInRows(props: CardChromeProps): number {
  return Math.ceil(
    getCardChromeHeightInPx(props) / GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
  );
}
