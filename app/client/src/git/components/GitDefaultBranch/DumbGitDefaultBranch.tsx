import {
  APPSMITH_ENTERPRISE,
  DEFAULT_BRANCH,
  DEFAULT_BRANCH_DESC,
  UPDATE,
  createMessage,
} from "ee/constants/messages";
import { Button, Link, Option, Select, Text } from "@appsmith/ads";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import type { FetchBranchesResponseData } from "git/requests/fetchBranchesRequest.types";
import noop from "lodash/noop";
import { useAppsmithEnterpriseUrl } from "git/hooks/useAppsmithEnterpriseUrl";

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
  updateDefaultBranch?: (branchName: string) => void;
}

function DumbGitDefaultBranch({
  branches = null,
  isGitProtectedFeatureLicensed = false,
  updateDefaultBranch = noop,
}: DumbGitDefaultBranchProps) {
  const [selectedValue, setSelectedValue] = useState<string | undefined>();

  const currentDefaultBranch = useMemo(() => {
    const defaultBranch = branches?.find((b) => b.default);

    return defaultBranch?.branchName;
  }, [branches]);

  const enterprisePricingUrl = useAppsmithEnterpriseUrl(
    "git_branch_protection",
  );

  const filteredBranches = useMemo(
    () => branches?.filter((branch) => !branch.branchName.includes("origin/")),
    [branches],
  );

  const isUpdateDisabled =
    !selectedValue || selectedValue === currentDefaultBranch;

  useEffect(
    function selectedValueOnInitEffect() {
      const defaultBranch = branches?.find((b) => b.default);

      setSelectedValue(defaultBranch?.branchName);
    },
    [branches],
  );

  const handleGetPopupContainer = useCallback(
    (triggerNode) => triggerNode.parentNode,
    [],
  );

  const handleUpdate = useCallback(() => {
    if (selectedValue) {
      AnalyticsUtil.logEvent("GS_DEFAULT_BRANCH_UPDATE", {
        old_branch: currentDefaultBranch,
        new_branch: selectedValue,
      });
      updateDefaultBranch(selectedValue);
    }
  }, [currentDefaultBranch, selectedValue, updateDefaultBranch]);

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
              className="inline-flex"
              kind="primary"
              target="_blank"
              to={enterprisePricingUrl}
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
          getPopupContainer={handleGetPopupContainer}
          isDisabled={!isGitProtectedFeatureLicensed}
          onChange={setSelectedValue}
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
          isDisabled={isUpdateDisabled}
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
