import type { DefaultRootState } from "react-redux";
import { getAnvilWidgetDOMId } from "layoutSystems/common/utils/LayoutElementPositionsObserver/utils";
import { LayoutSystemTypes } from "layoutSystems/types";
import { selectFeatureFlagCheck } from "ee/selectors/featureFlagsSelectors";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";

/**
 * The Anvil isolation boundary (M0).
 *
 * An application persisted as ANVIL only resolves to the Anvil layout system
 * when an Anvil-enabling flag is on. This keeps all Anvil runtime behavior
 * strictly behind `release_anvil_enabled`, with `license_ai_agent_enabled` as
 * the Anvil-specific derivative that preserves existing AI-Agent apps (which
 * render Anvil today without the Anvil flag). When neither flag is on, an
 * ANVIL-typed app falls back to FIXED so no Anvil code path is reachable.
 *
 * This check is only consulted for ANVIL-typed apps — FIXED/AUTO apps never
 * read the flags and are therefore behaviourally unchanged.
 */
const isAnvilEnabled = (state: DefaultRootState) =>
  selectFeatureFlagCheck(state, FEATURE_FLAG.release_anvil_enabled) ||
  selectFeatureFlagCheck(state, FEATURE_FLAG.license_ai_agent_enabled);

/**
 * Returns the layout system type based on the state of the application.
 * @param state - The current state of the application.
 * @returns The layout system type.
 */
export const getLayoutSystemType = (state: DefaultRootState) => {
  const applicationLayoutSystemType =
    state.ui.applications?.currentApplication?.applicationDetail?.appPositioning
      ?.type;

  // Check if the application has a defined appPositioning type
  if (applicationLayoutSystemType) {
    // Get the layout system type based on the appPositioning type
    const layoutSystemType = LayoutSystemTypes[applicationLayoutSystemType];

    // Anvil isolation boundary: gate the ANVIL branch behind the Anvil flag(s).
    // Any other persisted type (FIXED/AUTO) is returned unchanged.
    if (
      layoutSystemType === LayoutSystemTypes.ANVIL &&
      !isAnvilEnabled(state)
    ) {
      return LayoutSystemTypes.FIXED;
    }

    return layoutSystemType;
  }

  // If no layout system type is found, return FIXED as the default layout system type
  return LayoutSystemTypes.FIXED;
};

export const getWidgetSelectorByWidgetId = (
  state: DefaultRootState,
  widgetId: string,
) => {
  const layoutSystemType = getLayoutSystemType(state);

  switch (layoutSystemType) {
    case LayoutSystemTypes.ANVIL:
      return getAnvilWidgetDOMId(widgetId);
    default:
      return widgetId;
  }
};

export const isFixedLayoutSelector = (state: DefaultRootState) =>
  getLayoutSystemType(state) === LayoutSystemTypes.FIXED;
