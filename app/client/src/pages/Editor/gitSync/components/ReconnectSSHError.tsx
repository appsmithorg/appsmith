import { Callout, Text, toast } from "@appsmith/ads";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import styled from "styled-components";
import { useSSHKeyPair } from "../hooks";
import copy from "copy-to-clipboard";
import {
  COPIED_SSH_KEY,
  COPY_SSH_KEY,
  ERROR_SSH_RECONNECT_MESSAGE,
  ERROR_SSH_RECONNECT_OPTION1,
  ERROR_SSH_RECONNECT_OPTION2,
  NO_COPIED_SSH_KEY,
  createMessage,
} from "ee/constants/messages";
import { fetchGitStatusInit } from "actions/gitSyncActions";

const NumberedList = styled.ol`
  list-style-type: decimal;
  margin-left: 20px;
`;

const StyledCallout = styled(Callout)`
  margin-bottom: 24px;
`;

function ReconnectSSHError() {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [errorData, setErrorData] = useState<{ error: Error; response: any }>();
  const dispatch = useDispatch();

  const { fetchingSSHKeyPair, fetchSSHKeyPair, SSHKeyPair } = useSSHKeyPair();

  useEffect(() => {
    dispatch(
      fetchGitStatusInit({
        onErrorCallback: (error, response) => {
          setErrorData({ error, response });
        },
      }),
    );
    fetchSSHKeyPair();
  }, []);

  const handleClickOnCopy = () => {
    if (SSHKeyPair) {
      copy(SSHKeyPair);
      toast.show(createMessage(COPIED_SSH_KEY), { kind: "success" });
    } else {
      toast.show(createMessage(NO_COPIED_SSH_KEY), { kind: "error" });
    }
  };

  if (!errorData) {
    return null;
  }

  if (
    errorData &&
    errorData?.response?.responseMeta?.error?.code === "AE-GIT-4044"
  ) {
    return (
      <StyledCallout
        kind="error"
        links={[
          {
            children: createMessage(COPY_SSH_KEY),
            onClick: handleClickOnCopy,
            startIcon: "copy-control",
            isDisabled: fetchingSSHKeyPair,
          },
        ]}
      >
        <Text renderAs="p">{createMessage(ERROR_SSH_RECONNECT_MESSAGE)}</Text>
        <NumberedList>
          <li>{createMessage(ERROR_SSH_RECONNECT_OPTION1)}</li>
          <li>{createMessage(ERROR_SSH_RECONNECT_OPTION2)}</li>
        </NumberedList>
      </StyledCallout>
    );
  }

  return (
    <StyledCallout kind="error">
      {errorData.error?.message || "There was an unexpected error"}
    </StyledCallout>
  );
}

export default ReconnectSSHError;
