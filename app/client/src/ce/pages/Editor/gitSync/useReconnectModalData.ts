import { builderURL } from "@appsmith/RouteBuilder";
import {
  RECONNECT_MISSING_DATASOURCE_CREDENTIALS_DESCRIPTION,
  SKIP_TO_APPLICATION,
  createMessage,
} from "@appsmith/constants/messages";
import { EditorNames } from "@appsmith/hooks";

interface UseReconnectModalDataProps {
  pageId: string | null;
  appId: string | null;
}

function useReconnectModalData({ appId, pageId }: UseReconnectModalDataProps) {
  const editorURL =
    pageId &&
    builderURL({
      pageId,
    });

  return {
    skipMessage: createMessage(SKIP_TO_APPLICATION),
    missingDsCredentialsDescription: createMessage(
      RECONNECT_MISSING_DATASOURCE_CREDENTIALS_DESCRIPTION,
    ),
    editorURL,
    editorId: appId,
    parentEntityId: pageId,
    editorType: EditorNames.APPLICATION,
  };
}

export default useReconnectModalData;
