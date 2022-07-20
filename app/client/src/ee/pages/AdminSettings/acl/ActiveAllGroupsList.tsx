import React from "react";
import styled from "styled-components";
import {
  // Button,
  // Category,
  Icon,
  IconSize,
} from "components/ads";
import { Colors } from "constants/Colors";
import { ContentWrapper } from "./components";
import { HighlightText } from "./helpers/HighlightText";

const ActiveGroups = styled.div``;

const AllGroups = styled.div`
  margin: 24px 0 0;
`;

const TitleWrapper = styled.div`
  display: flex;
  border-bottom: 1px solid var(--appsmith-color-black-200);
  padding: 0 8px 12px 0;
`;

const Title = styled.span`
  font-weight: 600;
  font-size: 16px;
  line-height: 19px;
  letter-spacing: -0.461538px;
  color: var(--appsmith-color-black-700);
  margin: 0 8px;
`;

const EachGroup = styled.div`
  border-bottom: 1px solid var(--appsmith-color-black-200);
  color: var(--appsmith-color-black-800);
  font-weight: 400;
  font-size: 13px;
  line-height: 17px;
  letter-spacing: -0.24px;
  padding: 12px;
  display: flex;
  align-items: center;
  width: 100%;
  cursor: pointer;

  &:hover {
    .action-button {
      visibility: visible;
    }
    .remixicon-icon {
      visibility: visible;
    }
  }

  .remixicon-icon {
    visibility: hidden;
    margin-right: 12px;
  }

  &.added {
    background: #e5f6ec;

    .remixicon-icon {
      visibility: visible;
    }

    .action-button {
      display: none;
    }
  }

  &.removed {
    background: #ffe9e9;

    .remixicon-icon {
      visibility: visible;
    }

    .action-button {
      display: none;
    }
  }
`;

/*const Group = styled.div``;

const StyledButton = styled(Button)`
  font-weight: 600;
  font-size: 12px;
  line-height: 12px;
  text-align: center;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  color: var(--appsmith-color-black-700);
  border: 1px solid var(--appsmith-color-black-700);
  visibility: hidden;
  min-width: 68px;
`;

const Wrapper = styled.div`
  display: flex;

  .remixicon-icon {
    margin-right: 12px;
  }
`;*/

const EmptyActiveGroups = styled.div`
  text-align: center;
  margin: 32px;
  font-size: 16px;
  line-height: 1.5;
  color: var(--appsmith-color-black-700);
`;

export type ActiveAllGroupsProps = {
  activeGroups: Array<any>;
  allGroups?: Array<any>;
  activeOnly?: boolean;
  title?: string;
  searchValue?: string;
  addedAllGroups?: Array<any>;
  removedActiveGroups: Array<any>;
  onAddGroup?: (group: any) => void;
  onRemoveGroup: (group: any) => void;
};

export function ActiveAllGroupsList(props: ActiveAllGroupsProps) {
  const {
    activeGroups,
    activeOnly,
    addedAllGroups,
    allGroups,
    onAddGroup,
    onRemoveGroup,
    removedActiveGroups,
    searchValue,
  } = props;

  return (
    <ContentWrapper>
      <ActiveGroups data-testid="t--active-groups">
        <TitleWrapper>
          <Icon
            fillColor={Colors.GREEN}
            name="oval-check"
            size={IconSize.XXXL}
          />
          <Title data-testid="t--active-groups-title">
            {props.title ?? "Active Groups"}
          </Title>
        </TitleWrapper>
        {activeGroups && activeGroups.length > 0 ? (
          activeGroups.map((group: any) => {
            const removedGroup = removedActiveGroups.includes(group);
            return (
              <EachGroup
                className={removedGroup ? "removed" : ""}
                data-testid="t--active-group-row"
                key={group}
                onClick={() => {
                  onRemoveGroup(group);
                }}
              >
                <Icon fillColor={"#E32525"} name="minus" />
                <HighlightText highlight={searchValue} text={group} />
                {/* <StyledButton
                category={Category.tertiary}
                className="action-button"
                data-testid="t--group-remove-btn"
                onClick={() => {
                  onRemoveGroup(group);
                }}
                tag="button"
                text={"Remove"}
              /> */}
              </EachGroup>
            );
          })
        ) : (
          <EmptyActiveGroups>
            There are no permission assigned yet. Choose from the list of
            permission below to add them.
          </EmptyActiveGroups>
        )}
      </ActiveGroups>
      {!activeOnly && allGroups && (
        <AllGroups data-testid="t--all-groups">
          <TitleWrapper>
            <Icon
              fillColor={Colors.GREY_7}
              name="group-2-line"
              size={IconSize.XXXXL}
            />
            <Title>All Groups</Title>
          </TitleWrapper>
          {allGroups?.map((group: any) => {
            const addedGroup = addedAllGroups?.includes(group);
            return (
              <EachGroup
                className={addedGroup ? "added" : ""}
                data-testid="t--all-group-row"
                key={group}
                onClick={() => {
                  onAddGroup?.(group);
                }}
              >
                <Icon fillColor={"#03B365"} name="plus" />
                <HighlightText highlight={searchValue} text={group} />
                {/* <StyledButton
                  category={Category.tertiary}
                  className="action-button"
                  data-testid="t--group-add-btn"
                  onClick={() => {
                    onAddGroup(group);
                  }}
                  tag="button"
                  text={"Add"}
                /> */}
              </EachGroup>
            );
          })}
        </AllGroups>
      )}
    </ContentWrapper>
  );
}
