import React from "react";
import styled from "styled-components";
import {
  getApplicationViewerPageURL,
  BUILDER_PAGE_URL,
} from "constants/routes";
import { Card, Tooltip, Icon, Classes } from "@blueprintjs/core";
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
import { getInitialsAndColorCode } from "utils/AppsmithUtils";
import { ControlIcons } from "icons/ControlIcons";
import history from "utils/history";

const NameWrapper = styled.div`
  :hover {
    background-color: white;
  }
  border-radius: ${props => props.theme.radii[1]}px;
  width: ${props => props.theme.card.minWidth + props.theme.spaces[5] * 2}px;
  margin: ${props => props.theme.spaces[5]}px
    ${props => props.theme.spaces[5]}px;
`;

const Name = styled.div`
  padding-left: ${props => props.theme.spaces[5]}px;
  padding-right: ${props => props.theme.spaces[5]}px;
  padding-bottom: ${props => props.theme.spaces[5]}px;
  font-size: 16px;
  font-weight: 500;
  height: 50px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Wrapper = styled(Card)<{
  hasReadPermission?: boolean;
  backgroundColor: string;
}>`
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: ${props => props.theme.card.minWidth}px;
  height: ${props => props.theme.card.minHeight}px;
  position: relative;
  border-radius: ${props => props.theme.radii[1]}px;
  background-color: ${props => props.backgroundColor};
  margin: ${props => props.theme.spaces[5]}px
    ${props => props.theme.spaces[5]}px;
  .overlay {
    display: block;
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: 100%;
    ${props => !props.hasReadPermission && `pointer-events: none;`}
  }
  .overlay:hover {
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
        .more {
          span {
            display: inline-block;
          }
          z-index: 1;
          cursor: pointer;
        }
        button {
          span {
            font-weight: ${props => props.theme.fontWeights[3]};
            color: white;
          }
        }
      }
    }
  }
`;

const Control = styled.div<{ fixed?: boolean }>`
  outline: none;
  border: none;
  cursor: pointer;

  .${Classes.BUTTON}:nth-child(2) {
    margin-top: 7px;
  }
`;

const Initials = styled.span`
  font-size: 40px;
  font-weight: bold;
  color: #ffffff;
  margin: auto;
`;

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
  if (props.delete && hasEditPermission) {
    moreActionItems.push({
      value: "delete",
      onSelect: deleteApp,
      label: "Delete",
      intent: "danger",
    });
  }
  const initialsAndColorCode = getInitialsAndColorCode(props.application.name);

  const viewApplicationURL = getApplicationViewerPageURL(
    props.application.id,
    props.application.defaultPageId,
  );
  const editApplicationURL = BUILDER_PAGE_URL(
    props.application.id,
    props.application.defaultPageId,
  );

  return (
    <NameWrapper>
      <Wrapper
        key={props.application.id}
        hasReadPermission={hasReadPermission}
        backgroundColor={initialsAndColorCode[1]}
      >
        <Initials>{initialsAndColorCode[0]}</Initials>
        <div className="overlay">
          <ApplicationImage className="image-container">
            <Control className="control">
              {hasEditPermission && (
                <Button
                  onClick={() => history.push(editApplicationURL)}
                  filled
                  text="EDIT"
                  intent="primary"
                  icon={
                    <ControlIcons.EDIT_WHITE
                      color={Colors.WHITE}
                      width={13}
                      height={13}
                    />
                  }
                  className="t--application-edit-btn"
                  fluid
                />
              )}
              <Button
                onClick={() => history.push(viewApplicationURL)}
                intent="none"
                outline
                fluid
                text="LAUNCH"
                icon={<ControlIcons.LAUNCH_CONTROL width={13} height={13} />}
                size="small"
                className="t--application-view-link"
              />
            </Control>
          </ApplicationImage>
        </div>
      </Wrapper>
      <Name>{props.application.name}</Name>
    </NameWrapper>
  );
};

export default ApplicationCard;
