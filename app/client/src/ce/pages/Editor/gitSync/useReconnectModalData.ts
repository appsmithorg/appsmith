import { IDE_TYPE } from "ee/IDE/Interfaces/IDETypes";
import { builderURL } from "ee/RouteBuilder";
import {
  RECONNECT_MISSING_DATASOURCE_CREDENTIALS_DESCRIPTION,
  RECONNECT_MISSING_DATASOURCE_CREDENTIALS_DESCRIPTION_FOR_AGENTS,
  SKIP_TO_APPLICATION,
  SKIP_TO_APPLICATION_FOR_AGENTS,
  createMessage,
} from "ee/constants/messages";
import { getIsAiAgentFlowEnabled } from "ee/selectors/aiAgentSelectors";
import { getApplicationByIdFromWorkspaces } from "ee/selectors/applicationSelectors";
import { useSelector } from "react-redux";

interface UseReconnectModalDataProps {
  pageId: string | null;
  appId: string | null;
}

function useReconnectModalData({ appId, pageId }: UseReconnectModalDataProps) {
  const isAiAgentFlowEnabled = useSelector(getIsAiAgentFlowEnabled);
  const application = useSelector((state) =>
    getApplicationByIdFromWorkspaces(state, appId ?? ""),
  );
  const branch = application?.gitApplicationMetadata?.branchName;
  const basePageId = application?.pages?.find(
    (page) => page.id === pageId,
  )?.baseId;
  const editorURL =
    basePageId &&
    builderURL({
      basePageId,
      branch,
      params: {
        type: isAiAgentFlowEnabled ? "agent" : undefined,
      },
    });

  return {
    skipMessage: createMessage(
      isAiAgentFlowEnabled
        ? SKIP_TO_APPLICATION_FOR_AGENTS
        : SKIP_TO_APPLICATION,
    ),
    missingDsCredentialsDescription: createMessage(
      isAiAgentFlowEnabled
        ? RECONNECT_MISSING_DATASOURCE_CREDENTIALS_DESCRIPTION_FOR_AGENTS
        : RECONNECT_MISSING_DATASOURCE_CREDENTIALS_DESCRIPTION,
    ),
    editorURL,
    editorId: appId,
    parentEntityId: pageId,
    ideType: IDE_TYPE.App,
  };
}

export default useReconnectModalData;
