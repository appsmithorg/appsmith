import React, { useRef, useState } from "react";
import { ReactComponent as GitMerge } from "assets/icons/ads/git-merge.svg";
import styled from "styled-components";
import { Space } from "../components/StyledComponents";
import { useSelector } from "react-redux";

import { Popover2 } from "@blueprintjs/popover2";
import "@blueprintjs/popover2/lib/css/blueprint-popover2.css";
import { getTypographyByKey } from "constants/DefaultTheme";

import BranchDropdown from "../components/BranchDropdown";
import { Colors } from "constants/Colors";
import Icon from "components/ads/Icon";
import {
  createMessage,
  NAME_YOUR_NEW_BRANCH,
  SWITCH_BRANCHES,
} from "constants/messages";
import { getCurrentAppGitMetaData } from "selectors/applicationSelectors";

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
`;

const BranchDropdownContainer = styled.div`
  min-height: 40vh;
  display: flex;
  flex-direction: column;

  & .title {
    ${(props) => getTypographyByKey(props, "p1")};
  }
`;

const Container = styled.div`
  padding: ${(props) => props.theme.spaces[5]}px;
  padding-top: 0;
`;

const CloseBtnContainer = styled.div`
  align-self: flex-end;
  padding: ${(props) => props.theme.spaces[2]}px;
  padding-bottom: 0;
  border-radius: ${(props) => props.theme.radii[1]}px;
`;

function BranchButton() {
  const gitMetaData = useSelector(getCurrentAppGitMetaData);
  const currentBranchName = gitMetaData?.branchName;
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateBranchForm, setShowCreateNewBranchForm] = useState(false);
  const title = showCreateBranchForm
    ? createMessage(NAME_YOUR_NEW_BRANCH)
    : createMessage(SWITCH_BRANCHES);

  const dropdownContainerRef = useRef<HTMLDivElement>(null);

  return (
    <Popover2
      content={
        <BranchDropdownContainer
          onClick={(e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <CloseBtnContainer onClick={() => setIsOpen(false)}>
            <Icon fillColor={Colors.THUNDER_ALT} name="close-modal" />
          </CloseBtnContainer>
          <Container ref={dropdownContainerRef}>
            <span className="title">{title}</span>
            <Space size={4} />
            <BranchDropdown
              setShowCreateNewBranchForm={setShowCreateNewBranchForm}
            />
          </Container>
        </BranchDropdownContainer>
      }
      isOpen={isOpen}
      minimal
      modifiers={{ offset: { enabled: true, options: { offset: [7, 10] } } }}
      onInteraction={(nextState: boolean, e: any) => {
        // to avoid child popover (dropdown) from closing the branch popover
        // `captureDismiss` doesn't work since the dropdown currently uses popover
        // instead of popover2
        if (!dropdownContainerRef.current?.contains(e?.target)) {
          setIsOpen(nextState);
        }
      }}
      placement="top-start"
    >
      <ButtonContainer>
        <div className="icon">
          <GitMerge />
        </div>
        <div className="label">{currentBranchName}</div>
      </ButtonContainer>
    </Popover2>
  );
}

export default BranchButton;
