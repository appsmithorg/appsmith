import { fetchGitRemoteStatusInit } from "actions/gitSyncActions";
import { Callout, Text, toast } from "design-system";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import styled from "styled-components";
import { useSSHKeyPair } from "../hooks";
import copy from "copy-to-clipboard";

const NumberedList = styled.ol`
  list-style-type: decimal;
  margin-left: 20px;
`;

const StyledCallout = styled(Callout)`
  margin-bottom: 24px;
`;

function ReconnectSSHError() {
  const [errorData, setErrorData] = useState<{ error: Error; response: any }>();
  const dispatch = useDispatch();

  const { fetchingSSHKeyPair, fetchSSHKeyPair, SSHKeyPair } = useSSHKeyPair();

  useEffect(() => {
    dispatch(
      fetchGitRemoteStatusInit({
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
      toast.show("Copied SSH key", { kind: "success" });
    } else {
      toast.show("Could not copy SSH key", { kind: "error" });
    }
  };

  if (!errorData) {
    return null;
  }

  if (
    errorData &&
    errorData.response.responseMeta.error.code === "AE-GIT-4044"
  ) {
    return (
      <StyledCallout
        kind="error"
        links={[
          {
            children: "Copy SSH Key",
            onClick: handleClickOnCopy,
            startIcon: "copy-control",
            isDisabled: fetchingSSHKeyPair,
          },
        ]}
      >
        <Text renderAs="p">
          We couldn&apos;t connect to the repo due to a missing deploy key. You
          can fix this in two ways:
        </Text>
        <NumberedList>
          <li>Copy the SSH key below and add it to your repository.</li>
          <li>
            If you want to connect a new repository, you can disconnect and do
            that instead.
          </li>
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
