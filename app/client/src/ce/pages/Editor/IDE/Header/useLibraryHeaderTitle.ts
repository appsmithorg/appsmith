import { createMessage, HEADER_TITLES } from "ee/constants/messages";

/**
 * In CE this returns a simple text as title but this
 * hook is extended in EE where based on feature flags
 * the title changes
 */
function useLibraryHeaderTitle() {
  return createMessage(HEADER_TITLES.LIBRARIES);
}

export default useLibraryHeaderTitle;
