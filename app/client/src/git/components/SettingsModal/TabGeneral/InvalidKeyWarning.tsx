import React from "react";
import useStatus from "git/hooks/useStatus";
import {
  createMessage,
  GENERATE_DEPLOY_KEY_BTN,
  INVALID_DEPLOY_KEY_WARNING,
} from "ee/constants/messages";
import { Callout } from "@appsmith/ads";
import useGenerateDeployKey from "git/hooks/useGenerateDeployKey";

const INVALID_SSH_KEY_ERROR_CODE = "AE-GIT-4032";

function InvalidKeyWarning() {
  const { fetchStatusError } = useStatus();
  const { toggleGenerateSSHKeyModal } = useGenerateDeployKey();

  if (fetchStatusError?.code !== INVALID_SSH_KEY_ERROR_CODE) {
    return null;
  }

  return (
    <Callout
      isClosable
      kind="warning"
      links={[
        {
          children: createMessage(GENERATE_DEPLOY_KEY_BTN),
          onClick: () => toggleGenerateSSHKeyModal(true),
        },
      ]}
    >
      {createMessage(INVALID_DEPLOY_KEY_WARNING)}
    </Callout>
  );
}

export default InvalidKeyWarning;
