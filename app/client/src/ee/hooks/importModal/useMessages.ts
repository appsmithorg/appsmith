export * from "ce/hooks/importModal/useMessages";
import { default as CE_useMessages } from "ce/hooks/importModal/useMessages";
import { getShowQueryModule } from "@appsmith/selectors/moduleFeatureSelectors";
import {
  GENERIC_IMPORT_MODAL_TITLE,
  IMPORT_APP_PKG_MODAL_LABEL,
  createMessage,
} from "@appsmith/constants/messages";
import { useSelector } from "react-redux";

function useMessages() {
  const showQueryModule = useSelector(getShowQueryModule);
  const ce_messages = CE_useMessages();

  if (!showQueryModule) {
    return ce_messages;
  }

  return {
    title: createMessage(GENERIC_IMPORT_MODAL_TITLE),
    mainDescription: createMessage(IMPORT_APP_PKG_MODAL_LABEL),
  };
}

export default useMessages;
