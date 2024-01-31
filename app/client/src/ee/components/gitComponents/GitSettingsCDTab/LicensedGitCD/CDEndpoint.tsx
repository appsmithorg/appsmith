import { Text } from "design-system";
import React, { useMemo } from "react";
import { CopyContainer, CopyText } from "./styles";
import { CopyButton } from "pages/Editor/gitSync/components/CopyButton";
import { useSelector } from "react-redux";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import {
  createMessage,
  GIT_CD_COPY_ENDPOINT,
} from "@appsmith/constants/messages";

interface CDEndpointProps {
  branchName?: string;
  compact?: boolean;
  descText?: string;
}

function CDEndpoint({
  branchName,
  compact = false,
  descText = "API Endpoint",
}: CDEndpointProps) {
  const applicationId = useSelector(getCurrentApplicationId);

  const cdEndpointUrl = useMemo(() => {
    const origin = window.location.origin;
    return `${origin}/api/v1/git/deploy/app/${applicationId}?branchName=${branchName}`;
  }, [branchName]);

  const displayCDEndpointUrl = useMemo(() => {
    return `${origin}/api/v1/git/deploy...?branchName=${branchName}`;
  }, [cdEndpointUrl]);

  return (
    <div>
      <div className={compact ? "mb-1" : "mb-2"}>
        <Text renderAs="p">{descText}</Text>
      </div>
      <CopyContainer>
        <CopyText>{displayCDEndpointUrl}</CopyText>
        <CopyButton
          style={{ marginLeft: "auto" }}
          tooltipMessage={createMessage(GIT_CD_COPY_ENDPOINT)}
          value={cdEndpointUrl}
        />
      </CopyContainer>
    </div>
  );
}

export default CDEndpoint;
