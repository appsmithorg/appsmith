import React from "react";
import { ReactComponent as GitMerge } from "assets/icons/ads/git-merge.svg";
import styled from "styled-components";
import { Space } from "../components/StyledComponents";
import { currentGitBranch } from "selectors/gitSyncSelectors";
import { useSelector } from "react-redux";

import { Popover2, Placement } from "@blueprintjs/popover2";
import "@blueprintjs/popover2/lib/css/blueprint-popover2.css";
import { getTypographyByKey } from "constants/DefaultTheme";

import BranchDropdown from "../components/BranchDropdown";

const ButtonContainer = styled.div`
  display: flex;
  & label {
    color: ${(props) => props.theme.colors.editorBottomBar.branchBtnText};
    ${(props) => getTypographyByKey(props, "p1")}
  }
`;

const BranchDropdownContainer = styled.div`
  min-height: 40vh;
  padding: ${(props) => props.theme.spaces[2]}px;
`;

function BranchButton() {
  const currentBranch = useSelector(currentGitBranch);

  return (
    <Popover2
      content={
        <BranchDropdownContainer>
          <BranchDropdown />
        </BranchDropdownContainer>
      }
      isOpen
      minimal
      placement="top-start"
    >
      <ButtonContainer>
        <div className="icon">
          <GitMerge />
        </div>
        <Space horizontal size={2} />
        <div className="label">{currentBranch}</div>
      </ButtonContainer>
    </Popover2>
  );
}

export default BranchButton;
