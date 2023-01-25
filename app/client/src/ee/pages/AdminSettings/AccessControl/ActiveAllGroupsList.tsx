import React from "react";
import styled from "styled-components";
import { Icon, IconSize, TooltipComponent } from "design-system-old";
import { Colors } from "constants/Colors";
import { ContentWrapper } from "./components";
import { HighlightText } from "design-system-old";
import {
  createMessage,
  ACTIVE_ENTITIES,
  ALL_ENTITIES,
  NO_ACTIVE_ENTITIES_MESSAGE,
  EMPTY_ENTITIES_MESSAGE,
  ADD_ENTITY,
  REMOVE_ENTITY,
} from "@appsmith/constants/messages";
import { ActiveAllGroupsProps, BaseAclProps } from "./types";
import { getFilteredData } from "./utils/getFilteredData";

const ActiveGroups = styled.div``;

const AllGroups = styled.div`
  margin: 24px 0 0;
`;

const TitleWrapper = styled.div`
  display: flex;
  border-bottom: 1px solid var(--appsmith-color-black-200);
  padding: 0 8px 12px 8px;
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

  &[aria-disabled="true"] {
    pointer-events: none;
  }
`;

const EmptyActiveGroups = styled.div`
  text-align: center;
  margin: 32px;
  font-size: 16px;
  line-height: 1.5;
  color: var(--appsmith-color-black-700);
`;

export function ActiveAllGroupsList(props: ActiveAllGroupsProps) {
  const {
    activeGroups,
    activeOnly,
    addedAllGroups,
    allGroups,
    entityName,
    onAddGroup,
    onRemoveGroup,
    removedActiveGroups,
    searchValue = "",
  } = props;

  const handleOnAddRoles = (group: any) => {
    onAddGroup?.(group);
  };

  const handleOnRemoveRoles = (group: any) => {
    onRemoveGroup?.(group);
  };

  return (
    <ContentWrapper>
      <ActiveGroups data-testid="t--active-groups">
        <TitleWrapper>
          <Icon
            clickable={false}
            fillColor={Colors.GREEN}
            name="oval-check"
            size={IconSize.XXXL}
          />
          <Title data-testid="t--active-groups-title">
            {props.title ?? createMessage(ACTIVE_ENTITIES, entityName)}
          </Title>
        </TitleWrapper>
        {activeGroups && activeGroups.length > 0 ? (
          activeGroups.map((group: BaseAclProps) => {
            const removedGroup =
              getFilteredData(removedActiveGroups, group, true).length > 0;
            return (
              <EachGroup
                className={removedGroup ? "removed" : ""}
                data-testid="t--active-group-row"
                key={`group-${group.id}`}
                onClick={() => handleOnRemoveRoles(group)}
              >
                <Icon fillColor={Colors.ERROR_600} name="minus" />
                <TooltipComponent
                  content={createMessage(REMOVE_ENTITY, entityName)}
                  disabled={removedGroup}
                  hoverOpenDelay={0}
                  minWidth={"180px"}
                  openOnTargetFocus={false}
                  position="right"
                >
                  <HighlightText highlight={searchValue} text={group.name} />
                </TooltipComponent>
              </EachGroup>
            );
          })
        ) : (
          <EmptyActiveGroups>
            {createMessage(NO_ACTIVE_ENTITIES_MESSAGE, entityName)}
          </EmptyActiveGroups>
        )}
      </ActiveGroups>
      {!activeOnly && allGroups && (
        <AllGroups data-testid="t--all-groups">
          <TitleWrapper>
            <Icon
              clickable={false}
              fillColor={Colors.GREY_7}
              name="group-2-line"
              size={IconSize.XXXXL}
            />
            <Title>{createMessage(ALL_ENTITIES, entityName)}</Title>
          </TitleWrapper>
          {allGroups?.length > 0 ? (
            allGroups?.map((group: BaseAclProps) => {
              const addedGroup = addedAllGroups
                ? getFilteredData(addedAllGroups, group, true).length > 0
                : false;
              return (
                <EachGroup
                  className={addedGroup ? "added" : ""}
                  data-testid="t--all-group-row"
                  key={`group-${group.id}`}
                  onClick={() => handleOnAddRoles(group)}
                >
                  <Icon fillColor={Colors.GREEN} name="plus" />
                  <TooltipComponent
                    content={createMessage(ADD_ENTITY, entityName)}
                    disabled={addedGroup}
                    hoverOpenDelay={0}
                    minWidth={"180px"}
                    openOnTargetFocus={false}
                    position="right"
                  >
                    <HighlightText highlight={searchValue} text={group.name} />
                  </TooltipComponent>
                </EachGroup>
              );
            })
          ) : (
            <EmptyActiveGroups>
              {createMessage(EMPTY_ENTITIES_MESSAGE, entityName)}
            </EmptyActiveGroups>
          )}
        </AllGroups>
      )}
    </ContentWrapper>
  );
}
