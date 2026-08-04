import React from "react";
import { useSelector } from "react-redux";
import styled from "styled-components";

import { showTabOrderOverlaySelector } from "selectors/editorSelectors";
import { selectCombinedPreviewMode } from "selectors/gitModSelectors";
import { sanitizeTabOrder } from "utils/widgetTabOrder";
import { Layers } from "constants/Layers";

const Badge = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  z-index: ${Layers.widgetName};
  pointer-events: none;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  color: var(--ads-v2-color-fg-on-brand, #fff);
  background-color: var(--ads-v2-color-bg-brand, #2d6bf4);
  border-radius: var(--ads-v2-border-radius, 4px);
`;

interface TabOrderBadgeProps {
  tabOrder?: unknown;
}

/**
 * Editor-only overlay chip showing a widget's explicit tab order.
 *
 * Rendered on every widget that has a valid tabOrder while the tab order
 * overlay is toggled on (Alt+T). Hidden by default, in preview mode, and for
 * widgets without a valid explicit value.
 */
export function TabOrderBadge(props: TabOrderBadgeProps) {
  const showOverlay = useSelector(showTabOrderOverlaySelector);
  const isPreviewMode = useSelector(selectCombinedPreviewMode);

  const tabOrder = sanitizeTabOrder(props.tabOrder);

  if (!showOverlay || isPreviewMode || tabOrder === undefined) return null;

  return <Badge data-testid="t--tab-order-badge">{tabOrder}</Badge>;
}
