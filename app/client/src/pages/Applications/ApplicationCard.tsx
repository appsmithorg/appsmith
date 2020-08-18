import React, { useState } from "react";
import styled from "styled-components";
import {
  getApplicationViewerPageURL,
  BUILDER_PAGE_URL,
} from "constants/routes";
import { Card, Classes } from "@blueprintjs/core";
import { ApplicationPayload } from "constants/ReduxActionConstants";
import Button from "components/editorComponents/Button";
import { theme, getColorWithOpacity } from "constants/DefaultTheme";
import ContextDropdown, {
  ContextDropdownOption,
} from "components/editorComponents/ContextDropdown";
import { Colors } from "constants/Colors";
import {
  isPermitted,
  PERMISSION_TYPE,
} from "pages/Applications/permissionHelpers";
import { getInitialsAndColorCode, getColorCode } from "utils/AppsmithUtils";
import { ControlIcons } from "icons/ControlIcons";
import history from "utils/history";

const NameWrapper = styled.div<{
  hasReadPermission: boolean;
  showOverlay: boolean;
}>`
  ${props =>
    props.showOverlay &&
    `
      {
        background-color: white;

        .overlay {
          ${props.hasReadPermission &&
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
            background: ${
              props.hasReadPermission
                ? getColorWithOpacity(
                    props.theme.card.hoverBG,
                    props.theme.card.hoverBGOpacity,
                  )
                : null
            }
          }
        }
      }
   `}
  border-radius: ${props => props.theme.radii[1]}px;
  width: ${props => props.theme.card.minWidth + props.theme.spaces[5] * 2}px;
  margin: ${props => props.theme.spaces[5]}px
    ${props => props.theme.spaces[5]}px;
  overflow: hidden;
`;

const Name = styled.div`
  padding-left: ${props => props.theme.spaces[5]}px;
  padding-right: ${props => props.theme.spaces[5]}px;
  padding-bottom: ${props => props.theme.spaces[5]}px;
  height: 45px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  font-size: 16px;
  font-weight: 500;
  color: ${Colors.OXFORD_BLUE};
  line-height: 21px;
  letter-spacing: 0.1px;
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

  .${Classes.BUTTON} {
    margin-top: 7px;

    div {
      width: auto;
      height: auto;
    }
  }

  .${Classes.BUTTON_TEXT} {
    font-size: 12px;
  }

  .more {
    position: absolute;
    right: ${props => props.theme.spaces[6]}px;
    top: ${props => props.theme.spaces[4]}px;
  }
`;

const Initials = styled.span`
  font-size: 40px;
  font-weight: bold;
  color: #ffffff;
  margin: auto;
`;

const APPLICATION_CONTROL_FONTSIZE_INDEX = 5;

type ApplicationCardProps = {
  application: ApplicationPayload;
  duplicate?: (applicationId: string) => void;
  share?: (applicationId: string) => void;
  delete?: (applicationId: string) => void;
};

export const ApplicationCard = (props: ApplicationCardProps) => {
  const [showOverlay, setShowOverlay] = useState(false);

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
  let initials = getInitialsAndColorCode(props.application.name)[0];

  if (initials.length < 2 && props.application.name.length > 1) {
    initials += props.application.name[1].toUpperCase() || "";
  }

  const colorCode = getColorCode(props.application.id);

  const viewApplicationURL = getApplicationViewerPageURL(
    props.application.id,
    props.application.defaultPageId,
  );
  const editApplicationURL = BUILDER_PAGE_URL(
    props.application.id,
    props.application.defaultPageId,
  );

  return (
    <NameWrapper
      showOverlay={showOverlay}
      onMouseEnter={() => setShowOverlay(true)}
      onMouseLeave={() => setShowOverlay(false)}
      hasReadPermission={hasReadPermission}
      className="t--application-card"
    >
      <Wrapper
        key={props.application.id}
        hasReadPermission={hasReadPermission}
        backgroundColor={colorCode}
      >
        <Initials>{initials}</Initials>
        {showOverlay && (
          <div className="overlay">
            <ApplicationImage className="image-container">
              <Control className="control">
                {!!moreActionItems.length && (
                  <ContextDropdown
                    options={moreActionItems}
                    toggle={{
                      type: "icon",
                      icon: "MORE_HORIZONTAL_CONTROL",
                      iconSize:
                        theme.fontSizes[APPLICATION_CONTROL_FONTSIZE_INDEX],
                    }}
                    className="more"
                  />
                )}

                {hasEditPermission && (
                  <Button
                    onClick={() => history.push(editApplicationURL)}
                    filled
                    text="EDIT"
                    intent="primary"
                    icon={
                      <ControlIcons.EDIT_WHITE
                        color={Colors.WHITE}
                        width={9}
                        height={9}
                      />
                    }
                    className="t--application-edit-link"
                    fluid
                  />
                )}
                <Button
                  onClick={() => history.push(viewApplicationURL)}
                  intent="none"
                  outline
                  fluid
                  text="LAUNCH"
                  icon={<ControlIcons.LAUNCH_CONTROL width={9} height={9} />}
                  size="small"
                  className="t--application-view-link"
                />
              </Control>
            </ApplicationImage>
          </div>
        )}
      </Wrapper>
      <Name>{props.application.name}</Name>
    </NameWrapper>
  );
};

export default ApplicationCard;
