import type { MouseEventHandler } from "react";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";

export const objectCollapseAnalytics: MouseEventHandler = (ev) => {
  /*
   * Analytics events to be logged whenever user clicks on
   * react json viewer's controls to expand or collapse object/array
   */
  const targetNode = ev.target as HTMLElement;

  if (
    // collapse/expand icon click, object key click
    targetNode.parentElement?.parentElement?.parentElement?.firstElementChild?.classList.contains(
      "icon-container",
    ) ||
    // : click
    targetNode.parentElement?.parentElement?.firstElementChild?.classList.contains(
      "icon-container",
    ) ||
    // { click
    targetNode.parentElement?.firstElementChild?.classList.contains(
      "icon-container",
    ) ||
    // ellipsis click
    targetNode.classList.contains("node-ellipsis") ||
    // collapse/expand icon - svg path click
    targetNode.parentElement?.parentElement?.classList.contains(
      "collapsed-icon",
    ) ||
    targetNode.parentElement?.parentElement?.classList.contains("expanded-icon")
  ) {
    AnalyticsUtil.logEvent("PEEK_OVERLAY_COLLAPSE_EXPAND_CLICK");
  }
};

export const textSelectAnalytics = () => {
  AnalyticsUtil.logEvent("PEEK_OVERLAY_VALUE_COPIED");
};
