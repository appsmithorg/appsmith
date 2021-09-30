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
  getFetchingBranches,
  getGitBranches,
} from "selectors/gitSyncSelectors";

import Skeleton from "components/utils/Skeleton";
import { debug } from "loglevel";

const ListContainer = styled.div`
  flex: 1;
  overflow: auto;
  width: 300px;
  position: relative;
`;

const BranchListItemContainer = styled.div`
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
`;

// used for skeletons
const textInputHeight = 38;
const textHeight = 18;

function BranchListItem({ branch, onClick }: any) {
  return (
    <BranchListItemContainer onClick={onClick}>
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

  return showCreateBranchForm ? (
    <CreateNewBranchForm
      defaultBranchValue={filteredBranches.length === 0 ? searchText : ""}
      isCreatingNewBranch={isCreatingNewBranch}
      onCancel={() => {
        setShowCreateNewBranchForm(false);
        changeSearchText("");
      }}
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
            className="debugger-search"
            fill
            onChange={changeSearchText}
          />
        )}
      </div>
      {fetchingBranches && <BranchesLoading />}
      {!fetchingBranches && (
        <>
          <BranchListItemContainer onClick={handleCreateNew}>
            <span>
              Create new
              {filteredBranches.length === 0 && (
                <span>:&nbsp;{searchText}</span>
              )}
            </span>
          </BranchListItemContainer>
          <ListContainer>
            {filteredBranches.map((branch: string) => (
              <BranchListItem
                branch={branch}
                key={branch}
                onClick={() => switchBranch(branch)}
              />
            ))}
          </ListContainer>
        </>
      )}
    </>
  );
}
