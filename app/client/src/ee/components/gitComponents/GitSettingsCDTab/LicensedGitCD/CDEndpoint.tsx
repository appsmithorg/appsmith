import { Select, Text, Option } from "design-system";
import React, { useMemo } from "react";
import { CopyButton } from "pages/Editor/gitSync/components/CopyButton";
import { useSelector } from "react-redux";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import {
  createMessage,
  GIT_CD_COPY_ENDPOINT,
} from "@appsmith/constants/messages";
import styled from "styled-components";
import {
  getFetchingBranches,
  getGitBranches,
} from "selectors/gitSyncSelectors";

export const CopyContainer = styled.div`
  border: 1px solid var(--ads-v2-color-border);
  padding: 8px;
  box-sizing: border-box;
  border-radius: var(--ads-v2-border-radius);
  background-color: var(--ads-color-black-0);
  margin-bottom: 4px;
  font-size: var(--ads-font-size-2);
`;

export const CopyText = styled.span`
  flex: 1;
  color: var(--ads-v2-color-fg);
  margin-right: 8px;
  font-family: var(--ads-v2-font-family-code);
  word-wrap: break-word;
`;

const StyledSelect = styled(Select)`
  background-color: var(--ads-color-black-0);
  width: 120px;

  .rc-select-selector {
    min-width: 120px;
  }
`;

interface CDEndpointProps {
  compact?: boolean;
  descText?: string;
  selectedBranch: string;
  setSelectedBranch: (branch: string) => void;
}

function CDEndpoint({
  compact = false,
  descText = "API Endpoint",
  selectedBranch,
  setSelectedBranch,
}: CDEndpointProps) {
  const applicationId = useSelector(getCurrentApplicationId);
  const gitBranches = useSelector(getGitBranches);
  const isFetchingBranches = useSelector(getFetchingBranches);

  const branchList = useMemo(() => {
    return gitBranches
      .filter((branch) => !branch.branchName.includes("origin/"))
      .map((branch) => ({
        label: branch.branchName,
        value: branch.branchName,
      }));
  }, [gitBranches]);

  const cdEndpointUrl = useMemo(() => {
    const origin = window.location.origin;
    return `${origin}/api/v1/git/deploy/app/${applicationId}?branchName=${selectedBranch}`;
  }, [selectedBranch]);

  const curlCmd = useMemo(() => {
    return `curl --location --request POST ${cdEndpointUrl} --header 'Authorization: Bearer <bearer token>'`;
  }, [cdEndpointUrl]);

  return (
    <div>
      <div className={compact ? "mb-1" : "mb-2"}>
        <Text renderAs="p">{descText}</Text>
      </div>
      <div className="flex justify-between mb-1">
        <StyledSelect
          data-testid="t--cd-branch-select"
          dropdownMatchSelectWidth
          getPopupContainer={(triggerNode) => triggerNode.parentNode}
          isLoading={isFetchingBranches}
          onChange={(value) => setSelectedBranch(value)}
          size="sm"
          value={selectedBranch}
        >
          {branchList.map((branch) => (
            <Option key={branch.value}>{branch.value}</Option>
          ))}
        </StyledSelect>
        <CopyButton
          style={{ marginLeft: "auto" }}
          testIdSuffix="cd-curl-btn"
          tooltipMessage={createMessage(GIT_CD_COPY_ENDPOINT)}
          value={curlCmd}
        />
      </div>
      <CopyContainer>
        <CopyText data-testid="t--cd-curl-display">{curlCmd}</CopyText>
      </CopyContainer>
    </div>
  );
}

export default CDEndpoint;
