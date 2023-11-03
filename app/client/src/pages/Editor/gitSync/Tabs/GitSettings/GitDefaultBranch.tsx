import {
  APPSMITH_ENTERPRISE,
  DEFAULT_BRANCH,
  DEFAULT_BRANCH_DESC,
  UPDATE,
  createMessage,
} from "@appsmith/constants/messages";
import { updateGitDefaultBranch } from "actions/gitSyncActions";
import { isCEMode } from "@appsmith/utils";
import { Button, Link, Option, Select, Text } from "design-system";
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
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
  width: 240px;
  margin-right: 12px;
`;

function GitDefaultBranch() {
  const isCE = isCEMode();

  const dispatch = useDispatch();
  const unfilteredBranches = useSelector(getGitBranches);
  const [selectedValue, setSelectedValue] = useState<string | undefined>();

  const currentDefaultBranch = useMemo(() => {
    const defaultBranch = unfilteredBranches.find((b) => b.default);
    return defaultBranch?.branchName;
  }, [unfilteredBranches]);

  useEffect(() => {
    const defaultBranch = unfilteredBranches.find((b) => b.default);
    setSelectedValue(defaultBranch?.branchName);
  }, []);

  const branches = unfilteredBranches.filter(
    (branch) => !branch.branchName.includes("origin/"),
  );

  const handleUpdate = () => {
    if (selectedValue) {
      dispatch(updateGitDefaultBranch({ branchName: selectedValue }));
    }
  };

  const updateIsDisabled =
    isCE && (!selectedValue || selectedValue === currentDefaultBranch);

  return (
    <Container>
      <HeadContainer>
        <SectionTitle kind="heading-s" renderAs="h3">
          {createMessage(DEFAULT_BRANCH)}
        </SectionTitle>
        <SectionDesc kind="body-m" renderAs="p">
          {createMessage(DEFAULT_BRANCH_DESC)}
        </SectionDesc>
        <SectionDesc kind="body-m" renderAs="p">
          To change your default branch, try{" "}
          <Link
            kind="primary"
            style={{ display: "inline-flex" }}
            target="_blank"
            to="https://www.appsmith.com/enterprise?lead_source=git%20feat%20branch%20config"
          >
            {createMessage(APPSMITH_ENTERPRISE)}
          </Link>
        </SectionDesc>
      </HeadContainer>
      <BodyContainer>
        <StyledSelect
          isDisabled={isCE}
          onChange={(v) => setSelectedValue(v)}
          value={selectedValue}
        >
          {branches.map((b) => (
            <Option key={b.branchName} value={b.branchName}>
              {b.branchName}
            </Option>
          ))}
        </StyledSelect>
        <Button
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

export default GitDefaultBranch;
