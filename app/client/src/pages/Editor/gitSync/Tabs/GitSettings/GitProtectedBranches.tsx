import {
  APPSMITH_ENTERPRISE,
  BRANCH_PROTECTION,
  BRANCH_PROTECTION_DESC,
  UPDATE,
  createMessage,
} from "@appsmith/constants/messages";
import { updateGitProtectedBranchesInit } from "actions/gitSyncActions";
import { Button, Link, Option, Select, Text } from "design-system";
import { union, xor } from "lodash";
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getDefaultGitBranchName,
  getGitBranches,
  getIsUpdateProtectedBranchesLoading,
  getProtectedBranchesSelector,
} from "selectors/gitSyncSelectors";
import styled from "styled-components";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import { useAppsmithEnterpriseLink } from "./hooks";
import { REMOTE_BRANCH_PREFIX } from "../../constants";

const Container = styled.div`
  padding-top: 16px;
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
  width: 300px;
  margin-right: 12px;
`;

const StyledLink = styled(Link)`
  display: inline-flex;
`;

function GitProtectedBranches() {
  const dispatch = useDispatch();

  const unfilteredBranches = useSelector(getGitBranches);
  const defaultBranch = useSelector(getDefaultGitBranchName);

  const branchNames = useMemo(() => {
    const remoteBranchNames = [];
    const localBranchNames = [];
    for (const unfilteredBranch of unfilteredBranches) {
      if (unfilteredBranch.branchName === defaultBranch) {
        continue;
      }
      if (unfilteredBranch.branchName.includes(REMOTE_BRANCH_PREFIX)) {
        remoteBranchNames.push(
          unfilteredBranch.branchName.replace(REMOTE_BRANCH_PREFIX, ""),
        );
      } else {
        localBranchNames.push(unfilteredBranch.branchName);
      }
    }
    const branchNames = union(localBranchNames, remoteBranchNames);
    if (defaultBranch) {
      branchNames.unshift(defaultBranch);
    }
    return branchNames;
  }, [unfilteredBranches, defaultBranch]);

  const isGitProtectedFeatureLicensed = useFeatureFlag(
    FEATURE_FLAG.license_git_branch_protection_enabled,
  );
  const protectedBranches = useSelector(getProtectedBranchesSelector);
  const isUpdateLoading = useSelector(getIsUpdateProtectedBranchesLoading);
  const [selectedValues, setSelectedValues] = useState<string[]>();

  const enterprisePricingLink = useAppsmithEnterpriseLink(
    "git_branch_protection",
  );

  useEffect(() => {
    setSelectedValues(protectedBranches);
  }, []);

  const areProtectedBranchesDifferent = useMemo(() => {
    return xor(protectedBranches, selectedValues).length > 0;
  }, [protectedBranches, selectedValues]);

  const updateIsDisabled = !areProtectedBranchesDifferent;

  const handleUpdate = () => {
    dispatch(
      updateGitProtectedBranchesInit({
        protectedBranches: selectedValues ?? [],
      }),
    );
  };

  return (
    <Container>
      <HeadContainer>
        <SectionTitle kind="heading-s" renderAs="h3">
          {createMessage(BRANCH_PROTECTION)}
        </SectionTitle>
        <SectionDesc kind="body-m" renderAs="p">
          {createMessage(BRANCH_PROTECTION_DESC)}
        </SectionDesc>
        {!isGitProtectedFeatureLicensed && (
          <SectionDesc kind="body-m" renderAs="p">
            To protect multiple branches, try{" "}
            <StyledLink
              kind="primary"
              target="_blank"
              to={enterprisePricingLink}
            >
              {createMessage(APPSMITH_ENTERPRISE)}
            </StyledLink>
          </SectionDesc>
        )}
      </HeadContainer>
      <BodyContainer>
        <StyledSelect
          data-testid="t--git-protected-branches-select"
          dropdownMatchSelectWidth
          getPopupContainer={(triggerNode) => triggerNode.parentNode}
          isMultiSelect
          maxTagTextLength={8}
          onChange={(v) => setSelectedValues(v)}
          value={selectedValues}
        >
          {branchNames.map((branchName) => (
            <Option
              disabled={
                !isGitProtectedFeatureLicensed && branchName !== defaultBranch
              }
              key={branchName}
              value={branchName}
            >
              {branchName}
            </Option>
          ))}
        </StyledSelect>
        <Button
          data-testid="t--git-protected-branches-update-btn"
          isDisabled={updateIsDisabled}
          isLoading={isUpdateLoading}
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

export default GitProtectedBranches;
