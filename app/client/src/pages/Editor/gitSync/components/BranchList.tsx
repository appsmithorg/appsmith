import React, { useEffect, useState } from "react";
import TextInput from "components/ads/TextInput";
import styled from "styled-components";
import { getTypographyByKey } from "constants/DefaultTheme";
import { Colors } from "constants/Colors";
import { useDispatch, useSelector } from "react-redux";

import CreateNewBranchForm from "./CreateNewBranchForm";

import {
  createNewBranchInit,
  fetchBranchesInit,
  switchGitBranchInit,
} from "actions/gitSyncActions";
import {
  getCurrentGitBranch,
  getFetchingBranches,
  getGitBranches,
} from "selectors/gitSyncSelectors";

import Skeleton from "components/utils/Skeleton";

import scrollIntoView from "scroll-into-view-if-needed";

import BranchListHotkeys from "./BranchListHotkeys";

const ListContainer = styled.div`
  flex: 1;
  overflow: auto;
  width: 300px;
  position: relative;
`;

const BranchListItemContainer = styled.div<{
  hovered?: boolean;
  active?: boolean;
}>`
  padding: ${(props) =>
    `${props.theme.spaces[4]}px ${props.theme.spaces[5]}px`};
  ${(props) => getTypographyByKey(props, "p1")};
  cursor: pointer;
  &:hover {
    background-color: ${Colors.Gallery};
  }
  width: 100%;

  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  background-color: ${(props) =>
    props.hovered || props.active ? Colors.GREY_3 : ""};
`;

// used for skeletons
const textInputHeight = 38;
const textHeight = 18;

function BranchListItem({ active, branch, hovered, onClick }: any) {
  const itemRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (itemRef.current)
      scrollIntoView(itemRef.current, {
        scrollMode: "if-needed",
        block: "nearest",
        inline: "nearest",
      });
  }, [active]);

  return (
    <BranchListItemContainer hovered={hovered} onClick={onClick} ref={itemRef}>
      {branch}
    </BranchListItemContainer>
  );
}

function BranchesLoading() {
  return (
    <>
      <BranchListItemContainer>
        <div style={{ height: textHeight, width: "100%" }}>
          <Skeleton />
        </div>
      </BranchListItemContainer>
      <BranchListItemContainer>
        <div style={{ height: textHeight, width: "100%" }}>
          <Skeleton />
        </div>
      </BranchListItemContainer>
      <BranchListItemContainer>
        <div style={{ height: textHeight, width: "100%" }}>
          <Skeleton />
        </div>
      </BranchListItemContainer>
    </>
  );
}

export default function BranchList(props: {
  setIsPopupOpen?: (flag: boolean) => void;
  setShowCreateNewBranchForm?: (flag: boolean) => void;
}) {
  const branches = useSelector(getGitBranches);
  const [activeHoverIndex, setActiveHoverIndexInState] = useState(0);

  useEffect(() => {
    dispatch(fetchBranchesInit());
  }, []);

  const dispatch = useDispatch();
  const [filteredBranches, setFilteredBranches] = useState(branches || []);
  const [isCreatingNewBranch, setIsCreatingNewBranch] = useState(false);

  useEffect(() => {
    setFilteredBranches(branches);
  }, [branches]);

  const [searchText, changeSearchText] = useState("");

  const [showCreateBranchForm, setShowCreateNewBranchFormInState] = useState(
    false,
  );
  const fetchingBranches = useSelector(getFetchingBranches);
  const currentBranch = useSelector(getCurrentGitBranch);

  const setShowCreateNewBranchForm = (flag: boolean) => {
    setShowCreateNewBranchFormInState(flag);
    if (typeof props.setShowCreateNewBranchForm === "function") {
      props.setShowCreateNewBranchForm(flag);
    }
  };

  useEffect(() => {
    if (searchText) {
      const filteredBranches = branches.filter(
        (branch) =>
          branch.toLowerCase().indexOf(searchText.toLowerCase()) !== -1,
      );
      setFilteredBranches(filteredBranches);
    } else {
      setFilteredBranches(branches);
    }
  }, [searchText]);

  const handleCreateNew = () => {
    setShowCreateNewBranchForm(true);
  };

  const handleCreateNewBranch = (branchName: string) => {
    dispatch(
      createNewBranchInit({
        branchName,
        onErrorCallback: () => {
          setIsCreatingNewBranch(false);
        },
        onSuccessCallback: () => {
          setShowCreateNewBranchForm(false);
          setIsCreatingNewBranch(false);
          if (typeof props.setIsPopupOpen === "function")
            props.setIsPopupOpen(false);
        },
      }),
    );
  };

  const switchBranch = (branch: string) => {
    dispatch(switchGitBranchInit(branch));
  };

  const setActiveHoverIndex = (index: number) => {
    if (index < 0) setActiveHoverIndexInState(filteredBranches.length);
    if (index > filteredBranches.length) setActiveHoverIndexInState(0);
    else setActiveHoverIndexInState(index);
  };

  // const getIsCreateNewBranchInputIsValid = () => true;

  const handleUpKey = () => setActiveHoverIndex(activeHoverIndex - 1);

  const handleDownKey = () => setActiveHoverIndex(activeHoverIndex + 1);

  const handleSubmitKey = () => {
    // if (showCreateBranchForm) {
    //   handleCreateNewBranch();
    // }

    if (activeHoverIndex === 0) {
      handleCreateNew();
    } else {
      switchBranch(filteredBranches[activeHoverIndex + 1]);
    }
  };

  const handleCancelCreateNewBranch = () => {
    setShowCreateNewBranchForm(false);
    changeSearchText("");
  };

  const handleEscKey = () => {
    if (showCreateBranchForm) handleCancelCreateNewBranch();
  };

  return (
    <BranchListHotkeys
      handleDownKey={handleDownKey}
      handleEscKey={handleEscKey}
      handleSubmitKey={handleSubmitKey}
      handleUpKey={handleUpKey}
    >
      {showCreateBranchForm ? (
        <CreateNewBranchForm
          defaultBranchValue={filteredBranches.length === 0 ? searchText : ""}
          isCreatingNewBranch={isCreatingNewBranch}
          onCancel={handleCancelCreateNewBranch}
          onSubmit={handleCreateNewBranch}
        />
      ) : (
        <>
          <div style={{ width: 300 }}>
            {fetchingBranches && (
              <div style={{ width: "100%", height: textInputHeight }}>
                <Skeleton />
              </div>
            )}
            {!fetchingBranches && (
              <TextInput
                autoFocus
                className="debugger-search"
                fill
                onChange={changeSearchText}
              />
            )}
          </div>
          {fetchingBranches && <BranchesLoading />}
          {!fetchingBranches && (
            <>
              <BranchListItemContainer
                hovered={activeHoverIndex === 0}
                onClick={handleCreateNew}
              >
                <span>
                  Create new
                  {filteredBranches.length === 0 && (
                    <span>:&nbsp;{searchText}</span>
                  )}
                </span>
              </BranchListItemContainer>
              <ListContainer>
                {filteredBranches.map((branch: string, index: number) => (
                  <BranchListItem
                    active={currentBranch === branch}
                    branch={branch}
                    hovered={activeHoverIndex - 1 === index}
                    key={branch}
                    onClick={() => switchBranch(branch)}
                  />
                ))}
              </ListContainer>
            </>
          )}
        </>
      )}
    </BranchListHotkeys>
  );
}
