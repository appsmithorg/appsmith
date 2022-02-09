import React, { useEffect, useMemo, useState } from "react";
import TextInput from "components/ads/TextInput";
import styled, { useTheme } from "styled-components";
import { getTypographyByKey } from "constants/DefaultTheme";
import { Colors } from "constants/Colors";
import { useDispatch, useSelector } from "react-redux";

import {
  createNewBranchInit,
  fetchBranchesInit,
  switchGitBranchInit,
} from "actions/gitSyncActions";
import {
  getCurrentGitBranch,
  getFetchingBranches,
  getGitBranches,
  getGitBranchNames,
  getDefaultGitBranchName,
} from "selectors/gitSyncSelectors";

import Skeleton from "components/utils/Skeleton";

import scrollIntoView from "scroll-into-view-if-needed";

import BranchListHotkeys from "./BranchListHotkeys";
import {
  createMessage,
  FIND_OR_CREATE_A_BRANCH,
  SWITCH_BRANCHES,
  SYNC_BRANCHES,
} from "@appsmith/constants/messages";

import { Branch } from "entities/GitSync";
import Button, { Category, Size } from "components/ads/Button";
import { Space } from "./StyledComponents";
import Icon, { IconSize, IconWrapper } from "components/ads/Icon";
import { get } from "lodash";
import Tooltip from "components/ads/Tooltip";
import { Position } from "@blueprintjs/core";
import Spinner from "components/ads/Spinner";
import Text, { TextType } from "components/ads/Text";
import { Classes } from "components/ads/common";
import { isEllipsisActive } from "utils/helpers";
import { getIsStartingWithRemoteBranches } from "pages/Editor/gitSync/utils";

import SegmentHeader from "components/ads/ListSegmentHeader";
import BetaTag from "./BetaTag";
import AnalyticsUtil from "utils/AnalyticsUtil";

const ListContainer = styled.div`
  flex: 1;
  overflow: auto;
  width: 300px;
  position: relative;
`;

const BranchDropdownContainer = styled.div`
  height: 40vh;
  display: flex;
  flex-direction: column;

  & .title {
    ${(props) => getTypographyByKey(props, "p1")};
  }

  padding: ${(props) => props.theme.spaces[5]}px;
  min-height: 0;
`;

const BranchListItemContainer = styled.div<{
  hovered?: boolean;
  active?: boolean;
  isDefault?: boolean;
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

  display: ${(props) => (props.isDefault ? "flex" : "block")};
  .${Classes.TEXT} {
    width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    display: block;
  }
`;

// used for skeletons
const textInputHeight = 38;
const textHeight = 18;

function DefaultTag() {
  return (
    <div style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
      <Button
        category={Category.tertiary}
        disabled
        size={Size.xxs}
        text={"DEFAULT"}
      />
    </div>
  );
}

const CreateNewBranchContainer = styled.div`
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  & ${IconWrapper} {
    display: inline;
  }
  & span {
    display: inline;
    word-break: break-all;
  }
  & .large-text {
    ${(props) => getTypographyByKey(props, "p1")};
    color: ${Colors.BLACK};
  }
  & .small-text {
    ${(props) => getTypographyByKey(props, "p3")};
    color: ${Colors.GREY_7};
  }
`;

function CreateNewBranch({
  branch,
  className,
  currentBranch,
  hovered,
  isCreatingNewBranch,
  onClick,
  shouldScrollIntoView,
}: any) {
  useEffect(() => {
    if (itemRef.current && shouldScrollIntoView)
      scrollIntoView(itemRef.current, {
        scrollMode: "if-needed",
        block: "nearest",
        inline: "nearest",
      });
  }, [shouldScrollIntoView]);
  const itemRef = React.useRef<HTMLDivElement>(null);
  const theme = useTheme();

  return (
    <div
      onClick={onClick}
      style={{
        alignItems: "flex-start",
        cursor: isCreatingNewBranch ? "not-allowed" : "pointer",
        display: "flex",
        background: hovered ? Colors.GREY_3 : "unset",
        padding: get(theme, "spaces[5]"),
      }}
    >
      <Icon
        fillColor={get(theme, "colors.gitSyncModal.closeIcon")}
        name="git-branch"
        size={IconSize.XXXL}
      />
      <CreateNewBranchContainer className={className} ref={itemRef}>
        <span className="large-text">{`Create Branch: ${branch} `}</span>
        <span className="small-text">{`from \`${currentBranch}\``}</span>
      </CreateNewBranchContainer>
      <div style={{ alignSelf: "center", width: 12 }}>
        {isCreatingNewBranch && <Spinner />}
      </div>
    </div>
  );
}

function BranchListItem({
  active,
  branch,
  className,
  hovered,
  isDefault,
  onClick,
  shouldScrollIntoView,
}: any) {
  const itemRef = React.useRef<HTMLDivElement>(null);
  const textRef = React.useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (itemRef.current && shouldScrollIntoView)
      scrollIntoView(itemRef.current, {
        scrollMode: "if-needed",
        block: "nearest",
        inline: "nearest",
      });
  }, [shouldScrollIntoView]);

  return (
    <BranchListItemContainer
      active={active}
      className={className}
      hovered={hovered}
      isDefault={isDefault}
      onClick={onClick}
      ref={itemRef}
    >
      <Tooltip
        boundary="window"
        content={branch}
        disabled={!isEllipsisActive(textRef.current)}
        position={Position.TOP}
      >
        <Text ref={textRef} type={TextType.P1}>
          {branch}
        </Text>
      </Tooltip>
      {isDefault && <DefaultTag />}
    </BranchListItemContainer>
  );
}

function LoadingRow() {
  return (
    <BranchListItemContainer>
      <div style={{ height: textHeight, width: "100%" }}>
        <Skeleton />
      </div>
    </BranchListItemContainer>
  );
}

function BranchesLoading() {
  return (
    <>
      <LoadingRow />
      <LoadingRow />
      <LoadingRow />
    </>
  );
}

export const removeSpecialChars = (value: string) => {
  const separatorRegex = /(?![/-])\W+/;
  return value.split(separatorRegex).join("_");
};

// filter the branches according to the search text
// also pushes the default branch to the top
const useFilteredBranches = (branches: Array<Branch>, searchText: string) => {
  const [filteredBranches, setFilteredBranches] = useState<Array<string>>([]);
  useEffect(() => {
    setFilteredBranches(
      branches.reduce((res: Array<string>, curr: Branch) => {
        let shouldPush = false;
        if (searchText) {
          shouldPush =
            curr.branchName?.toLowerCase().indexOf(searchText.toLowerCase()) !==
            -1;
        } else {
          shouldPush = true;
        }

        if (shouldPush) {
          if (curr.default) {
            res.unshift(curr.branchName);
          } else {
            res.push(curr.branchName);
          }
        }

        return res;
      }, []),
    );
  }, [branches, searchText]);
  return filteredBranches;
};

const useActiveHoverIndex = (
  currentBranch: string | undefined,
  filteredBranches: Array<string>,
  isCreateNewBranchInputValid: boolean,
) => {
  const effectiveLength = isCreateNewBranchInputValid
    ? filteredBranches.length
    : filteredBranches.length - 1;

  const [activeHoverIndex, setActiveHoverIndexInState] = useState(0);
  const setActiveHoverIndex = (index: number) => {
    if (index < 0) setActiveHoverIndexInState(effectiveLength);
    else if (index > effectiveLength) setActiveHoverIndexInState(0);
    else setActiveHoverIndexInState(index);
  };

  useEffect(() => {
    const activeBranchIdx = filteredBranches.indexOf(currentBranch || "");
    if (activeBranchIdx !== -1) {
      setActiveHoverIndex(
        isCreateNewBranchInputValid ? activeBranchIdx + 1 : activeBranchIdx,
      );
    } else {
      setActiveHoverIndex(0);
    }
  }, [currentBranch, filteredBranches, isCreateNewBranchInputValid]);

  return { activeHoverIndex, setActiveHoverIndex };
};

const getIsActiveItem = (
  isCreateNewBranchInputValid: boolean,
  activeHoverIndex: number,
  index: number,
) =>
  (isCreateNewBranchInputValid ? activeHoverIndex - 1 : activeHoverIndex) ===
  index;

function Header({
  closePopup,
  fetchBranches,
}: {
  closePopup: () => void;
  fetchBranches: () => void;
}) {
  const title = createMessage(SWITCH_BRANCHES);
  const theme = useTheme();

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
      }}
    >
      <div style={{ display: "flex", alignItems: "center" }}>
        <span className="title">{title}</span>
        <span
          style={{
            display: "inline-block",
            marginLeft: get(theme, "spaces[1]"),
          }}
        >
          <Tooltip
            content={createMessage(SYNC_BRANCHES)}
            hoverOpenDelay={1000}
            modifiers={{
              flip: { enabled: false },
            }}
            position={Position.TOP}
          >
            <Icon
              fillColor={get(theme, "colors.gitSyncModal.closeIcon")}
              hoverFillColor={Colors.BLACK}
              name="refresh"
              onClick={fetchBranches}
              size={IconSize.XXXL}
            />
          </Tooltip>
        </span>
        <div style={{ marginLeft: 6 }}>
          <BetaTag />
        </div>
      </div>
      <Icon
        fillColor={get(theme, "colors.gitSyncModal.closeIcon")}
        hoverFillColor={Colors.BLACK}
        name="close-modal"
        onClick={closePopup}
        size={IconSize.XXXXL}
      />
    </div>
  );
}

export default function BranchList(props: {
  setIsPopupOpen?: (flag: boolean) => void;
}) {
  const dispatch = useDispatch();
  const pruneAndFetchBranches = () => {
    AnalyticsUtil.logEvent("GS_SYNC_BRANCHES", {
      source: "BRANCH_LIST_POPUP_FROM_BOTTOM_BAR",
    });
    dispatch(fetchBranchesInit({ pruneBranches: true }));
  };

  const branches = useSelector(getGitBranches);
  const branchNames = useSelector(getGitBranchNames);
  const currentBranch = useSelector(getCurrentGitBranch);
  const fetchingBranches = useSelector(getFetchingBranches);
  const defaultBranch = useSelector(getDefaultGitBranchName);

  const [searchText, changeSearchTextInState] = useState("");
  const changeSearchText = (text: string) => {
    changeSearchTextInState(removeSpecialChars(text));
  };

  const isCreateNewBranchInputValid = useMemo(
    () =>
      !!(
        searchText &&
        branchNames &&
        !branchNames.find((branch: string) => branch === searchText)
      ),
    [searchText, branchNames],
  );

  const filteredBranches = useFilteredBranches(branches, searchText);

  const { activeHoverIndex, setActiveHoverIndex } = useActiveHoverIndex(
    currentBranch,
    filteredBranches,
    isCreateNewBranchInputValid,
  );

  const [isCreatingNewBranch, setIsCreatingNewBranch] = useState(false);

  const handleCreateNewBranch = () => {
    if (isCreatingNewBranch) return;
    AnalyticsUtil.logEvent("GS_CREATE_NEW_BRANCH", {
      source: "BRANCH_LIST_POPUP_FROM_BOTTOM_BAR",
    });
    const branch = searchText;
    setIsCreatingNewBranch(true);
    dispatch(
      createNewBranchInit({
        branch,
        onErrorCallback: () => {
          setIsCreatingNewBranch(false);
        },
        onSuccessCallback: () => {
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

  const handleUpKey = () => setActiveHoverIndex(activeHoverIndex - 1);

  const handleDownKey = () => setActiveHoverIndex(activeHoverIndex + 1);

  const handleSubmitKey = () => {
    if (isCreateNewBranchInputValid) {
      handleCreateNewBranch();
    } else {
      switchBranch(filteredBranches[activeHoverIndex]);
    }
  };

  const handleEscKey = () => {
    if (typeof props.setIsPopupOpen === "function") props.setIsPopupOpen(false);
  };

  return (
    <BranchListHotkeys
      handleDownKey={handleDownKey}
      handleEscKey={handleEscKey}
      handleSubmitKey={handleSubmitKey}
      handleUpKey={handleUpKey}
    >
      <BranchDropdownContainer>
        <Header
          closePopup={() => {
            if (typeof props.setIsPopupOpen === "function")
              props.setIsPopupOpen(false);
          }}
          fetchBranches={pruneAndFetchBranches}
        />
        <Space size={4} />
        <div style={{ width: 300 }}>
          {fetchingBranches && (
            <div style={{ width: "100%", height: textInputHeight }}>
              <Skeleton />
            </div>
          )}
          {!fetchingBranches && (
            <TextInput
              autoFocus
              className="branch-search t--branch-search-input"
              fill
              onChange={changeSearchText}
              placeholder={createMessage(FIND_OR_CREATE_A_BRANCH)}
              value={searchText}
            />
          )}
        </div>
        {fetchingBranches && <BranchesLoading />}
        {!fetchingBranches && (
          <ListContainer>
            {isCreateNewBranchInputValid && (
              <CreateNewBranch
                branch={searchText}
                className="t--create-new-branch-button"
                currentBranch={currentBranch}
                hovered={activeHoverIndex === 0}
                isCreatingNewBranch={isCreatingNewBranch}
                onClick={handleCreateNewBranch}
                shouldScrollIntoView={activeHoverIndex === 0}
              />
            )}
            <SegmentHeader title={"Local branches"} />
            {filteredBranches.map((branch: string, index: number) => (
              <>
                {getIsStartingWithRemoteBranches(
                  filteredBranches[index - 1],
                  branch,
                ) && <SegmentHeader title={"Remote branches"} />}
                <BranchListItem
                  active={currentBranch === branch}
                  branch={branch}
                  className="t--branch-item"
                  hovered={getIsActiveItem(
                    isCreateNewBranchInputValid,
                    activeHoverIndex,
                    index,
                  )}
                  isDefault={branch === defaultBranch}
                  key={branch}
                  onClick={() => switchBranch(branch)}
                  shouldScrollIntoView={getIsActiveItem(
                    isCreateNewBranchInputValid,
                    activeHoverIndex,
                    index,
                  )}
                />
              </>
            ))}
          </ListContainer>
        )}
      </BranchDropdownContainer>
    </BranchListHotkeys>
  );
}
