import React from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import {
  getApplicationViewerPageURL,
  BUILDER_PAGE_URL,
} from "constants/routes";
import { Card, Tooltip, Icon } from "@blueprintjs/core";
import { ApplicationPayload } from "constants/ReduxActionConstants";
import Button from "components/editorComponents/Button";
import {
  theme,
  getBorderCSSShorthand,
  getColorWithOpacity,
} from "constants/DefaultTheme";
import ContextDropdown, {
  ContextDropdownOption,
} from "components/editorComponents/ContextDropdown";
import { Colors } from "constants/Colors";
import {
  isPermitted,
  PERMISSION_TYPE,
} from "pages/Applications/permissionHelpers";

const Wrapper = styled(Card)<{ hasReadPermission?: boolean }>`
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: ${props => props.theme.card.minWidth}px;
  height: ${props => props.theme.card.minHeight}px;
  position: relative;
  border-radius: ${props => props.theme.radii[1]}px;
  margin: ${props => props.theme.spaces[5]}px
    ${props => props.theme.spaces[5]}px;
  a {
    display: block;
    position: absolute;
    left: 0;
    top: 0;
    height: calc(100% - ${props => props.theme.card.titleHeight}px);
    width: 100%;
    ${props => !props.hasReadPermission && `pointer-events: none;`}
  }
  a:hover {
    ${props =>
      props.hasReadPermission &&
      `text-decoration: none;
    &:after {
      left: 0;
      top: 0;
      content: "";
      position: absolute;
      height: 100%;
      width: 100%;
    }
    & .control {
      display: block;
      z-index: 1;
    }`}
    & div.image-container {
      background: ${props =>
        props.hasReadPermission
          ? getColorWithOpacity(
              props.theme.card.hoverBG,
              props.theme.card.hoverBGOpacity,
            )
          : null};
    }
  }
`;
const ApplicationTitle = styled.div`
  font-size: ${props => props.theme.fontSizes[2]}px;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  position: absolute;
  bottom: 0;
  left: 0;
  height: ${props => props.theme.card.titleHeight}px;
  padding: ${props => props.theme.spaces[6]}px;
  width: 100%;
  border-top: ${props => getBorderCSSShorthand(props.theme.card.divider)};
  font-weight: ${props => props.theme.fontWeights[2]};
  font-size: ${props => props.theme.fontSizes[4]}px;
  & {
    span {
      display: inline-block;
    }
    .control {
      z-index: 1;
      position: absolute;
      right: ${props => props.theme.spaces[5] * 3}px;
      top: ${props => props.theme.spaces[5]}px;
    }
    .more {
      z-index: 1;
      position: absolute;
      right: ${props => props.theme.spaces[2]}px;
      top: ${props => props.theme.spaces[4]}px;
      cursor: pointer;
    }
    .apptitle {
      white-space: nowrap;
      width: 70%;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
`;
const ApplicationImage = styled.div`
  && {
    height: 100%;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    & {
      .control {
        display: none;
        button {
          span {
            font-weight: ${props => props.theme.fontWeights[3]};
          }
        }
      }
    }
  }
`;

const Control = styled.div<{ fixed?: boolean }>`
  outline: none;
  background: none;
  border: none;
  cursor: pointer;
`;

const APPLICATION_CONTROL_FONTSIZE_INDEX = 6;

type ApplicationCardProps = {
  application: ApplicationPayload;
  duplicate?: (applicationId: string) => void;
  share?: (applicationId: string) => void;
  delete?: (applicationId: string) => void;
};

export const ApplicationCard = (props: ApplicationCardProps) => {
  const hasEditPermission = isPermitted(
    props.application?.userPermissions ?? [],
    PERMISSION_TYPE.MANAGE_APPLICATION,
  );
  const hasReadPermission = isPermitted(
    props.application?.userPermissions ?? [],
    PERMISSION_TYPE.READ_APPLICATION,
  );
  const duplicateApp = () => {
    props.duplicate && props.duplicate(props.application.id);
  };
  const shareApp = () => {
    props.share && props.share(props.application.id);
  };
  const deleteApp = () => {
    props.delete && props.delete(props.application.id);
  };
  const moreActionItems: ContextDropdownOption[] = [];
  if (props.share) {
    moreActionItems.push({
      value: "share",
      onSelect: shareApp,
      label: "Share",
    });
  }
  if (props.duplicate) {
    moreActionItems.push({
      value: "duplicate",
      onSelect: duplicateApp,
      label: "Duplicate",
    });
  }
  if (props.delete) {
    moreActionItems.push({
      value: "delete",
      onSelect: deleteApp,
      label: "Delete",
      intent: "danger",
    });
  }

  const viewApplicationURL = getApplicationViewerPageURL(
    props.application.id,
    props.application.defaultPageId,
  );
  const editApplicationURL = BUILDER_PAGE_URL(
    props.application.id,
    props.application.defaultPageId,
  );

  return (
    <Wrapper key={props.application.id} hasReadPermission={hasReadPermission}>
      <ApplicationTitle>
        <div className="apptitle">{props.application.name}</div>
        {hasEditPermission && (
          <Link to={editApplicationURL} className="t--application-edit-link">
            <Control className="control">
              <Tooltip content="Edit" hoverOpenDelay={500}>
                {<Icon icon={"edit"} iconSize={14} color={Colors.HIT_GRAY} />}
              </Tooltip>
            </Control>
          </Link>
        )}
        <ContextDropdown
          options={moreActionItems}
          toggle={{
            type: "icon",
            icon: "MORE_VERTICAL_CONTROL",
            iconSize: theme.fontSizes[APPLICATION_CONTROL_FONTSIZE_INDEX],
          }}
          className="more"
        />
      </ApplicationTitle>
      <Link className="t--application-view-link" to={viewApplicationURL}>
        <ApplicationImage className="image-container">
          <Control className="control">
            <Button
              filled
              text="Launch"
              intent="primary"
              icon="play"
              iconAlignment="left"
              size="small"
              className="t--application-edit-btn"
            />
          </Control>
        </ApplicationImage>
      </Link>
    </Wrapper>
  );
};

export default ApplicationCard;
