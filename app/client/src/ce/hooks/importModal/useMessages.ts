import {
  IMPORT_APPLICATION_MODAL_LABEL,
  IMPORT_APPLICATION_MODAL_TITLE,
  createMessage,
} from "ee/constants/messages";

// In CE this won't look like a hook but in EE proper hook implementation is justified
function useMessages() {
  return {
    title: createMessage(IMPORT_APPLICATION_MODAL_TITLE),
    mainDescription: createMessage(IMPORT_APPLICATION_MODAL_LABEL),
  };
}

export default useMessages;
