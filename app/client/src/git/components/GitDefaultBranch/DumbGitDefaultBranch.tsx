import {
  APPSMITH_ENTERPRISE,
  DEFAULT_BRANCH,
  DEFAULT_BRANCH_DESC,
  UPDATE,
  createMessage,
} from "ee/constants/messages";
// import { updateGitDefaultBranch } from "actions/gitSyncActions";
import { Button, Link, Option, Select, Text } from "@appsmith/ads";
import React, { useEffect, useMemo, useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { getGitBranches } from "selectors/gitSyncSelectors";
import styled from "styled-components";
// import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
// import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { useAppsmithEnterpriseLink } from "./hooks";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import type { FetchBranchesResponseData } from "git/requests/fetchBranchesRequest.types";

const Container = styled.div`
  padding-top: 8px;
  padding-bottom: 16px;
`;

const HeadContainer = styled.div`
  margin-bottom: 16px;
`;

const BodyContainer = styled.div`
  display: flex;
`;

const SectionTitle = styled(Text)`
  font-weight: 600;
  margin-bottom: 4px;
`;

const SectionDesc = styled(Text)`
  margin-bottom: 4px;
`;

const StyledSelect = styled(Select)`
  width: 240px;
  margin-right: 12px;
`;

interface DumbGitDefaultBranchProps {
  branches: FetchBranchesResponseData | null;
  isGitProtectedFeatureLicensed: boolean;
}

function DumbGitDefaultBranch({
  branches = null,
  isGitProtectedFeatureLicensed = false,
}: DumbGitDefaultBranchProps) {
  const [selectedValue, setSelectedValue] = useState<string | undefined>();

  const currentDefaultBranch = useMemo(() => {
    const defaultBranch = branches?.find((b) => b.default);

    return defaultBranch?.branchName;
  }, [branches]);

  const enterprisePricingLink = useAppsmithEnterpriseLink(
    "git_branch_protection",
  );

  useEffect(
    function selectedValueOnInitEffect() {
      const defaultBranch = branches?.find((b) => b.default);

      setSelectedValue(defaultBranch?.branchName);
    },
    [branches],
  );

  const filteredBranches = branches?.filter(
    (branch) => !branch.branchName.includes("origin/"),
  );

  const handleUpdate = () => {
    if (selectedValue) {
      AnalyticsUtil.logEvent("GS_DEFAULT_BRANCH_UPDATE", {
        old_branch: currentDefaultBranch,
        new_branch: selectedValue,
      });
      //   dispatch(updateGitDefaultBranch({ branchName: selectedValue }));
    }
  };

  const updateIsDisabled =
    !selectedValue || selectedValue === currentDefaultBranch;

  return (
    <Container>
      <HeadContainer>
        <SectionTitle kind="heading-s" renderAs="h3">
          {createMessage(DEFAULT_BRANCH)}
        </SectionTitle>
        <SectionDesc kind="body-m" renderAs="p">
          {createMessage(DEFAULT_BRANCH_DESC)}
        </SectionDesc>
        {!isGitProtectedFeatureLicensed && (
          <SectionDesc kind="body-m" renderAs="p">
            To change your default branch, try{" "}
            <Link
              kind="primary"
              style={{ display: "inline-flex" }}
              target="_blank"
              to={enterprisePricingLink}
            >
              {createMessage(APPSMITH_ENTERPRISE)}
            </Link>
          </SectionDesc>
        )}
      </HeadContainer>
      <BodyContainer>
        <StyledSelect
          data-testid="t--git-default-branch-select"
          dropdownMatchSelectWidth
          getPopupContainer={(triggerNode) => triggerNode.parentNode}
          isDisabled={!isGitProtectedFeatureLicensed}
          onChange={(v) => setSelectedValue(v)}
          value={selectedValue}
        >
          {filteredBranches?.map((b) => (
            <Option key={b.branchName} value={b.branchName}>
              {b.branchName}
            </Option>
          ))}
        </StyledSelect>
        <Button
          data-testid="t--git-default-branch-update-btn"
          isDisabled={updateIsDisabled}
          kind="secondary"
          onClick={handleUpdate}
          size="md"
        >
          {createMessage(UPDATE)}
        </Button>
      </BodyContainer>
    </Container>
  );
}

export default DumbGitDefaultBranch;
