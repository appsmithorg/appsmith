import { builderURL } from "@appsmith/RouteBuilder";
import {
  RECONNECT_MISSING_DATASOURCE_CREDENTIALS_DESCRIPTION,
  SKIP_TO_APPLICATION,
  createMessage,
} from "@appsmith/constants/messages";
import { EditorNames } from "@appsmith/hooks";
import { getApplicationByIdFromWorkspaces } from "@appsmith/selectors/applicationSelectors";
import { useSelector } from "react-redux";

interface UseReconnectModalDataProps {
  pageId: string | null;
  appId: string | null;
}

function useReconnectModalData({ appId, pageId }: UseReconnectModalDataProps) {
  const application = useSelector((state) =>
    getApplicationByIdFromWorkspaces(state, appId ?? ""),
  );
  const basePageId = application?.pages?.find(
    (page) => page.id === pageId,
  )?.baseId;
  const editorURL =
    basePageId &&
    builderURL({
      basePageId,
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
