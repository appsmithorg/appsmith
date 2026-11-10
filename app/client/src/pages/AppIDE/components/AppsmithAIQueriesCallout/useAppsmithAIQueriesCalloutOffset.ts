import { useCallback, useState } from "react";
import { useShowAppsmithAIQueriesCallout } from "./AppsmithAIQueriesCallout";

/**
 * Layout state for the Appsmith AI queries banner.
 *
 * - showCallout: render the banner above the editor.
 * - topOffset: the banner's measured height in px, for EditorWrapperContainer.
 *   It is 0 when the banner is hidden.
 * - onHeightChange: pass to the banner so it can report its height.
 */
export function useAppsmithAIQueriesCalloutOffset() {
  const showCallout = useShowAppsmithAIQueriesCallout();
  const [height, setHeight] = useState(0);
  const onHeightChange = useCallback((next: number) => setHeight(next), []);

  return {
    showCallout,
    topOffset: showCallout ? height : 0,
    onHeightChange,
  };
}
