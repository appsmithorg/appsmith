import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { DefaultRolesToggle, MoreInfoPill } from "./components";
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
import type { ActiveAllGroupsProps, BaseGroupRoleProps } from "./types";
import { getFilteredData } from "./utils/getFilteredData";
import {
  isPermitted,
  PERMISSION_TYPE,
} from "@appsmith/utils/permissionHelpers";
import { Icon, Text, Tooltip } from "design-system";

const ActiveGroups = styled.div``;

const AllGroups = styled.div`
  margin: 24px 0 0;
`;

const HeadingWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid var(--ads-v2-color-border);
  align-items: center;
  padding: 0 8px 12px 8px;
`;

const Title = styled(Text)`
  color: var(--ads-v2-color-fg);
  margin: 0 8px;
`;

const EachGroup = styled.div`
  border-bottom: 1px solid var(--ads-v2-color-border);
  color: var(--ads-v2-color-fg);
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
    .remixicon-icon {
      visibility: visible;
    }
  }

  .remixicon-icon {
    visibility: hidden;
    margin-right: 12px;
  }

  &.added {
    background: var(--ads-v2-color-bg-success);

    .remixicon-icon {
      visibility: visible;
    }
  }

  &.removed {
    background: var(--ads-v2-color-bg-error);

    .remixicon-icon {
      visibility: visible;
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

const EmptyActiveGroups = styled(Text)`
  text-align: center;
  margin: 32px;
  color: var(--ads-v2-color-fg);
`;

const TitleWrapper = styled.div`
  display: flex;
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
    <div>
      <ActiveGroups data-testid="t--active-groups">
        <HeadingWrapper>
          <TitleWrapper>
            <Icon
              color="var(--ads-v2-color-fg-success)"
              name="oval-check"
              size="md"
            />
            <Title
              data-testid="t--active-groups-title"
              kind="heading-s"
              renderAs="span"
            >
              {props.title ?? createMessage(ACTIVE_ENTITIES, entityName)}
            </Title>
          </TitleWrapper>
        </HeadingWrapper>
        {activeGroups && activeGroups.length > 0 ? (
          activeGroups.map((group: BaseGroupRoleProps) => {
            const removedGroup =
              getFilteredData(removedActiveGroups, group, true).length > 0;
            const hasPermission = group?.userPermissions
              ? isPermitted(
                  group?.userPermissions,
                  entityName === "role"
                    ? PERMISSION_TYPE.UNASSIGN_PERMISSIONGROUPS
                    : PERMISSION_TYPE.REMOVE_USERS_FROM_USERGROUPS,
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
                  <Icon
                    color="var(--ads-v2-color-fg-error)"
                    name="subtract-line"
                  />
                ) : (
                  <Icon data-testid="t--lock-icon" name="lock-2-line" />
                )}
                <Tooltip
                  content={
                    hasPermission
                      ? createMessage(REMOVE_ENTITY, entityName)
                      : createMessage(NO_PERMISSION_TO_UNASSIGN)
                  }
                  isDisabled={removedGroup}
                  placement="right"
                >
                  <HighlightText highlight={searchValue} text={group.name} />
                </Tooltip>
                {group.autoCreated && (
                  <MoreInfoPill
                    data-testid="t--default-role"
                    isClosable={false}
                  >
                    {createMessage(DEFAULT_ROLES_PILL)}
                  </MoreInfoPill>
                )}
              </EachGroup>
            );
          })
        ) : (
          <EmptyActiveGroups kind="action-l" renderAs="p">
            {createMessage(NO_ACTIVE_ENTITIES_MESSAGE, entityName)}
          </EmptyActiveGroups>
        )}
      </ActiveGroups>
      {!activeOnly && allGroups && (
        <AllGroups data-testid="t--all-groups">
          <HeadingWrapper>
            <TitleWrapper>
              <Icon name="group-2-line" size="md" />
              <Title kind="heading-s" renderAs="span">
                {createMessage(ALL_ENTITIES, entityName)}
              </Title>
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
                  <Icon
                    color="var(--ads-v2-color-fg-success)"
                    name="add-line"
                  />
                  <Tooltip
                    content={createMessage(ADD_ENTITY, entityName)}
                    isDisabled={addedGroup}
                    placement="right"
                  >
                    <HighlightText highlight={searchValue} text={group.name} />
                  </Tooltip>
                  {group.autoCreated && (
                    <MoreInfoPill
                      data-testid="t--default-role"
                      isClosable={false}
                    >
                      {createMessage(DEFAULT_ROLES_PILL)}
                    </MoreInfoPill>
                  )}
                </EachGroup>
              );
            })
          ) : (
            <EmptyActiveGroups kind="action-l" renderAs="p">
              {createMessage(EMPTY_ENTITIES_MESSAGE, entityName)}
            </EmptyActiveGroups>
          )}
        </AllGroups>
      )}
    </div>
  );
}
