import {
  BRANCH_PROTECTION,
  BRANCH_PROTECTION_DESC,
  UPDATE,
  createMessage,
} from "@appsmith/constants/messages";
import { getGitProtectedBranches } from "@appsmith/selectors/gitSelectors";
import { isCEMode } from "@appsmith/utils";
import { Button, Link, Option, Select, Text } from "design-system";
import { xor } from "lodash";
import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { getGitBranches } from "selectors/gitSyncSelectors";
import styled from "styled-components";

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

function GitProtectedBranches() {
  const isCE = isCEMode();

  const unfilteredBranches = useSelector(getGitBranches);
  const branches = unfilteredBranches.filter(
    (b) => !b.branchName.includes("origin/"),
  );

  const protectedBranches = useSelector(getGitProtectedBranches);
  const [selectedValues, setSelectedValues] = useState<string[]>();

  useEffect(() => {
    setSelectedValues(protectedBranches);
  }, []);

  const areProtectedBranchesDifferent = useMemo(() => {
    return xor(protectedBranches, selectedValues).length > 0;
  }, [protectedBranches, selectedValues]);

  const updateIsDisabled = isCE && !areProtectedBranchesDifferent;

  return (
    <Container>
      <HeadContainer>
        <SectionTitle kind="heading-s" renderAs="h3">
          {createMessage(BRANCH_PROTECTION)}
        </SectionTitle>
        <SectionDesc kind="body-m" renderAs="p">
          {createMessage(BRANCH_PROTECTION_DESC)}
        </SectionDesc>
        <SectionDesc kind="body-m" renderAs="p">
          To protect multiple branches, try{" "}
          <Link
            kind="primary"
            style={{ display: "inline-flex" }}
            target="_blank"
            to="https://www.appsmith.com/enterprise?lead_source=git%20feat%20branch%20config"
          >
            Appsmith Enterprise
          </Link>
        </SectionDesc>
      </HeadContainer>
      <BodyContainer>
        <StyledSelect
          isDisabled={isCE}
          isMultiSelect
          maxTagTextLength={8}
          onChange={(v) => setSelectedValues(v)}
          value={selectedValues}
        >
          {branches.map((b) => (
            <Option key={b.branchName} value={b.branchName}>
              {b.branchName}
            </Option>
          ))}
        </StyledSelect>
        <Button isDisabled={updateIsDisabled} kind="secondary" size="md">
          {createMessage(UPDATE)}
        </Button>
      </BodyContainer>
    </Container>
  );
}

export default GitProtectedBranches;
