import {
  APPSMITH_ENTERPRISE,
  BRANCH_PROTECTION,
  BRANCH_PROTECTION_DESC,
  LEARN_MORE,
  UPDATE,
  createMessage,
} from "ee/constants/messages";
import { Button, Link, Option, Select, Text } from "@appsmith/ads";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { DOCS_BRANCH_PROTECTION_URL } from "constants/ThirdPartyConstants";
import { GIT_REMOTE_BRANCH_PREFIX } from "git/constants/misc";
import { useAppsmithEnterpriseUrl } from "git/hooks/useAppsmithEnterpriseUrl";
import type { FetchBranchesResponseData } from "git/requests/fetchBranchesRequest.types";
import xor from "lodash/xor";
import noop from "lodash/noop";
import type { FetchProtectedBranchesResponseData } from "git/requests/fetchProtectedBranchesRequest.types";

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

interface ProtectedBranchesViewProps {
  branches: FetchBranchesResponseData | null;
  defaultBranch: string | null;
  isProtectedBranchesLicensed: boolean;
  isUpdateProtectedBranchesLoading: boolean;
  protectedBranches: FetchProtectedBranchesResponseData | null;
  updateProtectedBranches?: (branches: string[]) => void;
}

function ProtectedBranchesView({
  branches = null,
  defaultBranch = null,
  isProtectedBranchesLicensed = false,
  isUpdateProtectedBranchesLoading = false,
  protectedBranches = null,
  updateProtectedBranches = noop,
}: ProtectedBranchesViewProps) {
  const [selectedValues, setSelectedValues] = useState<string[]>([]);

  const filteredBranches = useMemo(() => {
    const returnVal: string[] = [];

    for (const branch of branches ?? []) {
      if (branch.branchName === defaultBranch) {
        returnVal.unshift(branch.branchName);
      } else if (branch.branchName.includes(GIT_REMOTE_BRANCH_PREFIX)) {
        const localBranchName = branch.branchName.replace(
          GIT_REMOTE_BRANCH_PREFIX,
          "",
        );

        if (!returnVal.includes(localBranchName)) {
          returnVal.push(
            branch.branchName.replace(GIT_REMOTE_BRANCH_PREFIX, ""),
          );
        }
      } else {
        returnVal.push(branch.branchName);
      }
    }

    return returnVal;
  }, [branches, defaultBranch]);

  const isUpdateDisabled = useMemo(() => {
    const areDifferent = xor(protectedBranches, selectedValues).length > 0;

    return !areDifferent;
  }, [protectedBranches, selectedValues]);

  const enterprisePricingUrl = useAppsmithEnterpriseUrl(
    "git_branch_protection",
  );

  useEffect(
    function setValueOnInit() {
      setSelectedValues(protectedBranches ?? []);
    },
    [protectedBranches],
  );

  const sendAnalyticsEvent = useCallback(() => {
    const eventData = {
      branches_added: [] as string[],
      branches_removed: [] as string[],
      protected_branches: selectedValues,
    };

    for (const val of selectedValues) {
      if (!protectedBranches?.includes(val)) {
        eventData.branches_added.push(val);
      }
    }

    for (const val of protectedBranches ?? []) {
      if (!selectedValues.includes(val)) {
        eventData.branches_removed.push(val);
      }
    }

    AnalyticsUtil.logEvent("GS_PROTECTED_BRANCHES_UPDATE", eventData);
  }, [protectedBranches, selectedValues]);

  const handleUpdate = useCallback(() => {
    sendAnalyticsEvent();
    updateProtectedBranches(selectedValues ?? []);
  }, [selectedValues, sendAnalyticsEvent, updateProtectedBranches]);

  const handleGetPopupContainer = useCallback(
    (triggerNode) => triggerNode.parentNode,
    [],
  );

  return (
    <Container>
      <HeadContainer>
        <SectionTitle kind="heading-s" renderAs="h3">
          {createMessage(BRANCH_PROTECTION)}
        </SectionTitle>
        <SectionDesc kind="body-m" renderAs="p">
          {createMessage(BRANCH_PROTECTION_DESC)}{" "}
          <StyledLink target="_blank" to={DOCS_BRANCH_PROTECTION_URL}>
            {createMessage(LEARN_MORE)}
          </StyledLink>
        </SectionDesc>
        {!isProtectedBranchesLicensed && (
          <SectionDesc kind="body-m" renderAs="p">
            To protect multiple branches, try{" "}
            <StyledLink
              kind="primary"
              target="_blank"
              to={enterprisePricingUrl}
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
          getPopupContainer={handleGetPopupContainer}
          isMultiSelect
          maxTagTextLength={8}
          onChange={setSelectedValues}
          value={selectedValues}
        >
          {filteredBranches.map((branchName) => (
            <Option
              disabled={
                !isProtectedBranchesLicensed && branchName !== defaultBranch
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
          isDisabled={isUpdateDisabled}
          isLoading={isUpdateProtectedBranchesLoading}
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

export default ProtectedBranchesView;
