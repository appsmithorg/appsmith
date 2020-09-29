import React, { useState } from "react";
import styled from "styled-components";
import {
  getApplicationViewerPageURL,
  BUILDER_PAGE_URL,
} from "constants/routes";
import {
  Card,
  Classes,
  HTMLDivProps,
  ICardProps,
  Position,
} from "@blueprintjs/core";
import { ApplicationPayload } from "constants/ReduxActionConstants";
import { getColorWithOpacity } from "constants/DefaultTheme";
import {
  isPermitted,
  PERMISSION_TYPE,
} from "pages/Applications/permissionHelpers";
import {
  getInitialsAndColorCode,
  getApplicationIcon,
} from "utils/AppsmithUtils";
import { omit } from "lodash";
import Text, { TextType } from "components/ads/Text";
import Button, { Category, Size } from "components/ads/Button";
import Icon, { IconSize } from "components/ads/Icon";
import Menu from "components/ads/Menu";
import MenuItem, { MenuItemProps } from "components/ads/MenuItem";
import AppIcon, { AppIconName } from "components/ads/AppIcon";
import EditableText, {
  EditInteractionKind,
  SavingState,
} from "components/ads/EditableText";
import ColorSelector from "components/ads/ColorSelector";
import MenuDivider from "components/ads/MenuDivider";
import IconSelector from "components/ads/IconSelector";
// import { appCardColors } from "constants/AppConstants";
import { getThemeDetails } from "selectors/themeSelectors";
import { useSelector } from "react-redux";
import { UpdateApplicationPayload } from "api/ApplicationApi";
import { getIsSavingAppName } from "selectors/applicationSelectors";
import { Classes as CsClasses } from "components/ads/common";

type NameWrapperProps = {
  hasReadPermission: boolean;
  showOverlay: boolean;
  isMenuOpen: boolean;
};

const NameWrapper = styled((props: HTMLDivProps & NameWrapperProps) => (
  <div {...omit(props, ["hasReadPermission", "showOverlay", "isMenuOpen"])} />
))`
  .bp3-card {
    border-radius: 0;
    box-shadow: none;
  }
  ${props =>
    props.showOverlay &&
    `
      {
        background-color: ${props.theme.colors.card.hoverBorder}};
        justify-content: center;
        align-items: center;

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
              props.hasReadPermission && !props.isMenuOpen
                ? getColorWithOpacity(
                    props.theme.colors.card.hoverBG,
                    props.theme.colors.card.hoverBGOpacity,
                  )
                : null
            }
          }
        }
      }
   `}
  width: ${props => props.theme.card.minWidth + props.theme.spaces[4] * 2}px;
  margin: ${props => props.theme.spaces[4]}px
    ${props => props.theme.spaces[4]}px;
  overflow: hidden;
`;

const Wrapper = styled(
  (
    props: ICardProps & {
      hasReadPermission?: boolean;
      backgroundColor: string;
    },
  ) => <Card {...omit(props, ["hasReadPermission", "backgroundColor"])} />,
)`
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: ${props => props.theme.card.minWidth}px;
  height: ${props => props.theme.card.minHeight}px;
  position: relative;
  background-color: ${props => props.backgroundColor};
  margin: ${props => props.theme.spaces[4]}px
    ${props => props.theme.spaces[4]}px;
  .overlay {
    display: block;
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: 100%;
    ${props => !props.hasReadPermission && `pointer-events: none;`}
  }
  .bp3-card {
    border-radius: 0;
  }
  .${CsClasses.APP_ICON} {
    margin: 0 auto;
    svg {
      path {
        fill: #fff;
      }
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
    color: white;
  }

  .more {
    position: absolute;
    right: ${props => props.theme.spaces[6]}px;
    top: ${props => props.theme.spaces[4]}px;
  }
`;

const AppNameWrapper = styled.div`
  padding: 12px;
  padding-top: 0;
`;
type ApplicationCardProps = {
  application: ApplicationPayload;
  duplicate?: (applicationId: string) => void;
  share?: (applicationId: string) => void;
  delete?: (applicationId: string) => void;
  update?: (id: string, data: UpdateApplicationPayload) => void;
};

const EditButton = styled(Button)`
  margin-bottom: 8px;
`;

const ContextDropdownWrapper = styled.div`
  position: absolute;
  top: -6px;
  right: -3px;

  .${Classes.POPOVER_TARGET} {
    span {
      background: ${props => props.theme.colors.card.targetBg};

      svg {
        path {
          fill: ${props => props.theme.colors.card.iconColor};
        }
      }
    }
  }
`;

export const ApplicationCard = (props: ApplicationCardProps) => {
  const [showOverlay, setShowOverlay] = useState(false);
  const themeDetails = useSelector(getThemeDetails);
  const initialsAndColorCode = getInitialsAndColorCode(
    props.application.name,
    themeDetails.theme.colors.appCardColors,
  );
  const isSavingName = useSelector(getIsSavingAppName);
  let initials = initialsAndColorCode[0];
  const colorCode = props.application?.color || initialsAndColorCode[1];
  const appIcon = (props.application?.icon ||
    getApplicationIcon(props.application.id)) as AppIconName;
  const [selectedColor, setSelectedColor] = useState<string>(colorCode);

  const hasEditPermission = isPermitted(
    props.application?.userPermissions ?? [],
    PERMISSION_TYPE.MANAGE_APPLICATION,
  );
  const hasReadPermission = isPermitted(
    props.application?.userPermissions ?? [],
    PERMISSION_TYPE.READ_APPLICATION,
  );
  const updateColor = (color: string) => {
    setSelectedColor(color);
    props.update &&
      props.update(props.application.id, {
        color: color,
      });
  };
  const updateIcon = (icon: AppIconName) => {
    props.update &&
      props.update(props.application.id, {
        icon: icon,
      });
  };
  const duplicateApp = () => {
    props.duplicate && props.duplicate(props.application.id);
  };
  const shareApp = () => {
    props.share && props.share(props.application.id);
  };
  const deleteApp = () => {
    props.delete && props.delete(props.application.id);
  };
  const moreActionItems: MenuItemProps[] = [];
  if (props.share) {
    moreActionItems.push({
      onSelect: shareApp,
      text: "Share",
      icon: "share",
      cypressSelector: "t--share",
    });
  }
  if (props.duplicate && hasEditPermission) {
    moreActionItems.push({
      onSelect: duplicateApp,
      text: "Duplicate",
      icon: "duplicate",
      cypressSelector: "t--duplicate",
    });
  }
  if (props.delete && hasEditPermission) {
    moreActionItems.push({
      onSelect: deleteApp,
      text: "Delete",
      icon: "delete",
      cypressSelector: "t--delete",
    });
  }

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const ContextMenu = (
    <ContextDropdownWrapper>
      <Menu
        position={Position.RIGHT_TOP}
        target={<Icon name="context-menu" size={IconSize.XXXL}></Icon>}
        className="more"
        onOpening={() => {
          setIsMenuOpen(true);
        }}
        onClosing={() => {
          setIsMenuOpen(false);
          setShowOverlay(false);
        }}
      >
        {hasEditPermission && (
          <EditableText
            defaultValue={props.application.name}
            editInteractionKind={EditInteractionKind.SINGLE}
            onTextChanged={(onChange: string) => {
              console.log(onChange);
            }}
            valueTransform={(value: any) => value.toUpperCase()}
            placeholder={"Edit text input"}
            hideEditIcon={false}
            isInvalid={(value: string) => {
              if (!value) {
                return "Name cannot be empty";
              } else {
                return false;
              }
            }}
            savingState={
              isSavingName ? SavingState.STARTED : SavingState.NOT_STARTED
            }
            isEditingDefault={false}
            fill={true}
            onBlur={(value: string) => {
              props.update &&
                props.update(props.application.id, {
                  name: value,
                });
            }}
          />
        )}
        {hasEditPermission && (
          <>
            <ColorSelector
              defaultValue={colorCode}
              colorPalette={themeDetails.theme.colors.appCardColors}
              fill={true}
              onSelect={updateColor}
            />
            <MenuDivider />
          </>
        )}
        {hasEditPermission && (
          <>
            <IconSelector
              fill={true}
              selectedIcon={appIcon}
              selectedColor={selectedColor}
              onSelect={updateIcon}
            />
            <MenuDivider />
          </>
        )}
        {moreActionItems.map((item: MenuItemProps) => {
          return <MenuItem key={item.text} {...item}></MenuItem>;
        })}
      </Menu>
    </ContextDropdownWrapper>
  );

  if (initials.length < 2 && props.application.name.length > 1) {
    initials += props.application.name[1].toUpperCase() || "";
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
    <NameWrapper
      showOverlay={showOverlay}
      onMouseEnter={() => setShowOverlay(true)}
      onMouseLeave={() => {
        // If the menu is not open, then setOverlay false
        // Set overlay false on outside click.
        !isMenuOpen && setShowOverlay(false);
      }}
      hasReadPermission={hasReadPermission}
      isMenuOpen={isMenuOpen}
      className="t--application-card"
    >
      <Wrapper
        key={props.application.id}
        hasReadPermission={hasReadPermission}
        backgroundColor={colorCode}
      >
        <AppIcon size={Size.large} name={appIcon} />
        {/* <Initials>{initials}</Initials> */}
        {showOverlay && (
          <div className="overlay">
            <ApplicationImage className="image-container">
              <Control className="control">
                {!!moreActionItems.length && ContextMenu}

                {/* {!!moreActionItems.length && (
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
                )} */}

                {hasEditPermission && !isMenuOpen && (
                  <EditButton
                    text="Edit"
                    size={Size.medium}
                    icon={"edit"}
                    className="t--application-edit-link"
                    fill
                    href={editApplicationURL}
                  />
                )}
                {!isMenuOpen && (
                  <Button
                    text="LAUNCH"
                    size={Size.medium}
                    category={Category.tertiary}
                    className="t--application-view-link"
                    icon={"rocket"}
                    href={viewApplicationURL}
                    fill
                  />
                )}
              </Control>
            </ApplicationImage>
          </div>
        )}
      </Wrapper>
      <AppNameWrapper>
        <Text type={TextType.H3}>{props.application.name}</Text>
      </AppNameWrapper>
    </NameWrapper>
  );
};

export default ApplicationCard;
