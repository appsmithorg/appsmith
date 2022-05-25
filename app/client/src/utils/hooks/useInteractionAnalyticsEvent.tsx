import { interactionAnalyticsEvent } from "utils/AppsmithUtils";

export default function useInteractionAnalyticsEvent(
  ref: React.RefObject<HTMLElement>,
) {
  return function(args: Record<string, unknown>) {
    ref.current?.dispatchEvent(interactionAnalyticsEvent(args));
  };
}
