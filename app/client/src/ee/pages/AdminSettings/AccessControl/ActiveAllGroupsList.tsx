import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { Icon, IconSize, TooltipComponent } from "design-system-old";
import { Colors } from "constants/Colors";
import { ContentWrapper, DefaultRolesToggle, MoreInfoPill } from "./components";
import { HighlightText } from "design-system-old";
import {
  createMessage,
  ACTIVE_ENTITIES,
  ALL_ENTITIES,
  NO_ACTIVE_ENTITIES_MESSAGE,
  EMPTY_ENTITIES_MESSAGE,
  ADD_ENTITY,
  REMOVE_ENTITY,
  NO_PERMISSION_TO_UNASSIGN,
  DEFAULT_ROLES_PILL,
} from "@appsmith/constants/messages";
import { ActiveAllGroupsProps, BaseGroupRoleProps } from "./types";
import { getFilteredData } from "./utils/getFilteredData";
import {
  isPermitted,
  PERMISSION_TYPE,
} from "@appsmith/utils/permissionHelpers";

const ActiveGroups = styled.div``;

const AllGroups = styled.div`
  margin: 24px 0 0;
`;

const HeadingWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid var(--appsmith-color-black-200);
  align-items: center;
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

  &.disabled {
    cursor: not-allowed;

    .remixicon-icon {
      visibility: visible;
    }

    > span {
      opacity: 0.5;
    }
  }
`;

const EmptyActiveGroups = styled.div`
  text-align: center;
  margin: 32px;
  font-size: 16px;
  line-height: 1.5;
  color: var(--appsmith-color-black-700);
`;

const TitleWrapper = styled.div`
  display: flex;
  padding: 0 8px 12px 8px;
  align-items: center;
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
  const [showToggle, setShowToggle] = useState(
    entityName === "role" ? true : false,
  );
  const [isToggleActive, setIsToggleActive] = useState(false);

  const filteredAllGroups = useMemo(
    () =>
      isToggleActive || !showToggle
        ? allGroups
        : allGroups?.filter((group) => !group.autoCreated),
    [isToggleActive, allGroups, showToggle],
  );

  useEffect(() => {
    setShowToggle(entityName === "role" ? true : false);
  }, [entityName]);

  const handleOnAddRoles = (group: any) => {
    onAddGroup?.(group);
  };

  const handleOnRemoveRoles = (group: any) => {
    onRemoveGroup?.(group);
  };

  return (
    <ContentWrapper>
      <ActiveGroups data-testid="t--active-groups">
        <HeadingWrapper>
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
        </HeadingWrapper>
        {activeGroups && activeGroups.length > 0 ? (
          activeGroups.map((group: BaseGroupRoleProps) => {
            const removedGroup =
              getFilteredData(removedActiveGroups, group, true).length > 0;
            const hasPermission =
              entityName === "role"
                ? isPermitted(
                    group?.userPermissions,
                    PERMISSION_TYPE.UNASSIGN_PERMISSIONGROUPS,
                  )
                : true;
            return (
              <EachGroup
                className={`${removedGroup ? "removed" : ""} ${
                  hasPermission ? "" : "disabled"
                }`}
                data-testid="t--active-group-row"
                key={`group-${group.id}`}
                onClick={() => hasPermission && handleOnRemoveRoles(group)}
              >
                {hasPermission ? (
                  <Icon fillColor={Colors.ERROR_600} name="minus" />
                ) : (
                  <Icon
                    clickable={false}
                    data-testid="t--lock-icon"
                    name="lock-2-line"
                  />
                )}
                <TooltipComponent
                  content={
                    hasPermission
                      ? createMessage(REMOVE_ENTITY, entityName)
                      : createMessage(NO_PERMISSION_TO_UNASSIGN)
                  }
                  disabled={removedGroup}
                  hoverOpenDelay={0}
                  minWidth={"180px"}
                  openOnTargetFocus={false}
                  position="right"
                >
                  <HighlightText highlight={searchValue} text={group.name} />
                </TooltipComponent>
                {group.autoCreated && (
                  <MoreInfoPill data-testid="t--default-role">
                    {createMessage(DEFAULT_ROLES_PILL)}
                  </MoreInfoPill>
                )}
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
          <HeadingWrapper>
            <TitleWrapper>
              <Icon
                clickable={false}
                fillColor={Colors.GREY_7}
                name="group-2-line"
                size={IconSize.XXXXL}
              />
              <Title>{createMessage(ALL_ENTITIES, entityName)}</Title>
            </TitleWrapper>
            {showToggle && (
              <DefaultRolesToggle
                isToggleActive={isToggleActive}
                setIsToggleActive={setIsToggleActive}
              />
            )}
          </HeadingWrapper>
          {allGroups?.length > 0 && filteredAllGroups?.length ? (
            filteredAllGroups?.map((group: BaseGroupRoleProps) => {
              const addedGroup = addedAllGroups
                ? getFilteredData(addedAllGroups, group, true).length > 0
                : false;
              return (
                <EachGroup
                  className={`${addedGroup ? "added" : ""}`}
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
                  {group.autoCreated && (
                    <MoreInfoPill data-testid="t--default-role">
                      {createMessage(DEFAULT_ROLES_PILL)}
                    </MoreInfoPill>
                  )}
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
