import React, { useEffect, useState } from "react";
import { ReactComponent as GitMerge } from "assets/icons/ads/git-merge.svg";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";

import { Popover2 } from "@blueprintjs/popover2";
import "@blueprintjs/popover2/lib/css/blueprint-popover2.css";
import { getTypographyByKey } from "constants/DefaultTheme";

import { Colors } from "constants/Colors";
import { getCurrentAppGitMetaData } from "selectors/applicationSelectors";
import BranchList from "../components/BranchList";
import { fetchBranchesInit } from "actions/gitSyncActions";

const ButtonContainer = styled.div`
  display: flex;
  align-items: center;
  & .label {
    color: ${(props) => props.theme.colors.editorBottomBar.branchBtnText};
    ${(props) => getTypographyByKey(props, "p1")};
    line-height: 18px;
  }
  & .icon {
    height: 24px;
  }
  margin: 0 ${(props) => props.theme.spaces[4]}px;
  cursor: pointer;
  &:hover svg path {
    fill: ${Colors.CHARCOAL};
  }
  & .label {
    width: 100px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

function BranchButton() {
  const gitMetaData = useSelector(getCurrentAppGitMetaData);
  const currentBranch = gitMetaData?.branchName;
  const [isOpen, setIsOpen] = useState(false);
  const dispatch = useDispatch();
  const fetchBranches = () => dispatch(fetchBranchesInit());

  useEffect(() => {
    fetchBranches();
  }, []);

  return (
    <Popover2
      content={<BranchList setIsPopupOpen={setIsOpen} />}
      isOpen={isOpen}
      minimal
      modifiers={{ offset: { enabled: true, options: { offset: [7, 10] } } }}
      onInteraction={(nextState: boolean) => {
        setIsOpen(nextState);
      }}
      placement="top-start"
    >
      <ButtonContainer className="t--branch-button">
        <div className="icon">
          <GitMerge />
        </div>
        <div className="label">{currentBranch}</div>
      </ButtonContainer>
    </Popover2>
  );
}

export default BranchButton;
