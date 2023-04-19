import React from "react";
import styled from "styled-components";
import history from "utils/history";
import { Classes, Text, TextType } from "design-system-old";
import { useLocation } from "react-router-dom";
import { Icon } from "design-system";

// TODO (tanvi): replace with Link
const StyledManageUsers = styled("a")<{ isApplicationInvite?: boolean }>`
  display: flex;

  ${(props) =>
    props.isApplicationInvite
      ? `padding: 12px 0; border-top: 1px solid
          ${props.theme.colors.menuBorder};`
      : `padding: 12px 0 0;`}
  &&&& {
    text-decoration: none;
  }

  .${Classes.TEXT} {
    color: ${(props) => props.theme.colors.modal.manageUser};
    margin-right: ${(props) => props.theme.spaces[1]}px;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.6px;
    line-height: normal;
  }
  .${Classes.ICON} {
    svg path {
      fill: ${(props) => props.theme.colors.modal.manageUser};
    }
  }

  &:hover {
    .${Classes.TEXT} {
      color: ${(props) => props.theme.colors.modal.headerText};
    }
    .${Classes.ICON} {
      svg path {
        fill: ${(props) => props.theme.colors.modal.headerText};
      }
    }
  }
`;

function ManageUsers({
  isApplicationInvite,
  workspaceId,
}: {
  isApplicationInvite?: boolean;
  workspaceId: string;
}) {
  const currentPath = useLocation().pathname;
  const pathRegex = /(?:\/workspace\/)\w+(?:\/settings)/;

  return !pathRegex.test(currentPath) ? (
    // TODO (tanvi): replace with link
    <StyledManageUsers
      className="manageUsers"
      isApplicationInvite={isApplicationInvite}
      onClick={() => {
        history.push(`/workspace/${workspaceId}/settings/members`);
      }}
    >
      <Text type={TextType.H6}>MANAGE USERS</Text>
      <Icon name="manage" size="sm" />
    </StyledManageUsers>
  ) : null;
}
export default ManageUsers;
