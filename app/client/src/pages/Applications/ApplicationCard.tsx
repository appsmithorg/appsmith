import React, { useEffect, useState, useRef, useContext } from "react";
import styled, { ThemeContext } from "styled-components";
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
  getRandomPaletteColor,
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
import { useSelector } from "react-redux";
import { UpdateApplicationPayload } from "api/ApplicationApi";
import {
  getIsFetchingApplications,
  getIsSavingAppName,
  getIsErroredSavingAppName,
} from "selectors/applicationSelectors";
import { Classes as CsClasses } from "components/ads/common";
import TooltipComponent from "components/ads/Tooltip";
import { isEllipsisActive } from "utils/helpers";
import ForkApplicationModal from "./ForkApplicationModal";
import { Toaster } from "components/ads/Toast";
import { Variant } from "components/ads/common";

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
  ${(props) =>
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
  width: ${(props) => props.theme.card.minWidth}px;
  height: ${(props) => props.theme.card.minHeight}px;
  position: relative;
  background-color: ${(props) => props.backgroundColor};
  margin: ${(props) => props.theme.spaces[5]}px;
  .overlay {
    display: block;
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: 100%;
    ${(props) => !props.hasReadPermission && `pointer-events: none;`}
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
            font-weight: ${(props) => props.theme.fontWeights[3]};
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
    right: ${(props) => props.theme.spaces[6]}px;
    top: ${(props) => props.theme.spaces[4]}px;
  }
`;

const MoreOptionsContainer = styled.div`
  width: 22px;
  height: 22px;
  background-color: rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const AppNameWrapper = styled.div<{ isFetching: boolean }>`
  padding: 12px;
  padding-top: 0;
  padding-bottom: 0;
  margin-bottom: 12px;
  ${(props) =>
    props.isFetching
      ? `
    width: 119px;
    height: 16px;
    margin-left: 10px;
  `
      : null};
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3; /* number of lines to show */
  -webkit-box-orient: vertical;
  word-break: break-word;
  color: ${(props) => props.theme.colors.text.heading};
`;
type ApplicationCardProps = {
  application: ApplicationPayload;
  duplicate?: (applicationId: string) => void;
  share?: (applicationId: string) => void;
  delete?: (applicationId: string) => void;
  update?: (id: string, data: UpdateApplicationPayload) => void;
  enableImportExport?: boolean;
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
      svg {
        path {
          fill: ${(props) => props.theme.colors.card.iconColor};
        }
      }
    }
  }
`;

export function ApplicationCard(props: ApplicationCardProps) {
  const isFetchingApplications = useSelector(getIsFetchingApplications);
  const theme = useContext(ThemeContext);
  const isSavingName = useSelector(getIsSavingAppName);
  const isErroredSavingName = useSelector(getIsErroredSavingAppName);
  const initialsAndColorCode = getInitialsAndColorCode(
    props.application.name,
    theme.colors.appCardColors,
  );
  let initials = initialsAndColorCode[0];

  const [showOverlay, setShowOverlay] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [moreActionItems, setMoreActionItems] = useState<MenuItemProps[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isForkApplicationModalopen, setForkApplicationModalOpen] = useState(
    false,
  );
  const [lastUpdatedValue, setLastUpdatedValue] = useState("");
  const appNameWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let colorCode;
    if (props.application.color) {
      colorCode = props.application.color;
    } else {
      colorCode = getRandomPaletteColor(theme.colors.appCardColors);
    }
    setSelectedColor(colorCode);
  }, [props.application.color]);
  useEffect(() => {
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
    // add fork app option to menu
    if (hasEditPermission) {
      moreActionItems.push({
        onSelect: forkApplicationInitiate,
        text: "Fork",
        icon: "fork",
        cypressSelector: "t--fork-app",
      });
    }
    if (!!props.enableImportExport && hasExportPermission) {
      moreActionItems.push({
        onSelect: exportApplicationAsJSONFile,
        text: "Export",
        icon: "download",
        cypressSelector: "t--export-app",
      });
    }
    setMoreActionItems(moreActionItems);
    addDeleteOption();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const appIcon = (props.application?.icon ||
    getApplicationIcon(props.application.id)) as AppIconName;
  const hasEditPermission = isPermitted(
    props.application?.userPermissions ?? [],
    PERMISSION_TYPE.MANAGE_APPLICATION,
  );
  const hasReadPermission = isPermitted(
    props.application?.userPermissions ?? [],
    PERMISSION_TYPE.READ_APPLICATION,
  );
  const hasExportPermission = isPermitted(
    props.application?.userPermissions ?? [],
    PERMISSION_TYPE.EXPORT_APPLICATION,
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
  const exportApplicationAsJSONFile = () => {
    // export api response comes with content-disposition header.
    // there is no straightforward way to handle it with axios/fetch
    const id = `t--export-app-link`;
    const existingLink = document.getElementById(id);
    existingLink && existingLink.remove();
    const link = document.createElement("a");
    link.href = `/api/v1/applications/export/${props.application.id}`;
    link.target = "_blank";
    link.id = id;
    document.body.appendChild(link);
    link.click();
    setIsMenuOpen(false);
    Toaster.show({
      text: `Successfully exported ${props.application.name}`,
      variant: Variant.success,
    });
    link.remove();
  };
  const forkApplicationInitiate = () => {
    // open fork application modal
    // on click on an organisation, create app and take to app
    setForkApplicationModalOpen(true);
  };
  const deleteApp = () => {
    setShowOverlay(false);
    props.delete && props.delete(props.application.id);
  };
  const askForConfirmation = () => {
    const updatedActionItems = [...moreActionItems];
    updatedActionItems.pop();
    updatedActionItems.push({
      onSelect: deleteApp,
      text: "Are you sure?",
      icon: "delete",
      type: "warning",
      cypressSelector: "t--delete",
    });
    setMoreActionItems(updatedActionItems);
  };
  const addDeleteOption = () => {
    if (props.delete && hasEditPermission) {
      const index = moreActionItems.findIndex((el) => el.icon === "delete");
      if (index >= 0) {
        moreActionItems.pop();
      }
      moreActionItems.push({
        onSelect: askForConfirmation,
        text: "Delete",
        icon: "delete",
        cypressSelector: "t--delete-confirm",
      });
      setMoreActionItems(moreActionItems);
    }
  };
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
  const appNameText = (
    <Text cypressSelector="t--app-card-name" type={TextType.H3}>
      {props.application.name}
    </Text>
  );

  const ContextMenu = (
    <ContextDropdownWrapper>
      <Menu
        className="more"
        onClosing={() => {
          setIsMenuOpen(false);
          setShowOverlay(false);
          addDeleteOption();
          if (lastUpdatedValue && props.application.name !== lastUpdatedValue) {
            props.update &&
              props.update(props.application.id, {
                name: lastUpdatedValue,
              });
          }
        }}
        onOpening={() => {
          setIsMenuOpen(true);
        }}
        position={Position.RIGHT_TOP}
        target={
          <MoreOptionsContainer>
            <Icon name="context-menu" size={IconSize.XXXL} />
          </MoreOptionsContainer>
        }
      >
        {hasEditPermission && (
          <EditableText
            className="t--application-name"
            defaultValue={props.application.name}
            editInteractionKind={EditInteractionKind.SINGLE}
            fill
            hideEditIcon={false}
            isError={isErroredSavingName}
            isInvalid={(value: string) => {
              if (!value) {
                return "Name cannot be empty";
              } else {
                return false;
              }
            }}
            onBlur={(value: string) => {
              props.update &&
                props.update(props.application.id, {
                  name: value,
                });
            }}
            onTextChanged={(value: string) => {
              setLastUpdatedValue(value);
            }}
            placeholder={"Edit text input"}
            savingState={
              isSavingName ? SavingState.STARTED : SavingState.NOT_STARTED
            }
            underline
          />
        )}
        {hasEditPermission && (
          <>
            <ColorSelector
              colorPalette={theme.colors.appCardColors}
              defaultValue={selectedColor}
              fill
              onSelect={updateColor}
            />
            <MenuDivider />
          </>
        )}
        {hasEditPermission && (
          <>
            <IconSelector
              fill
              onSelect={updateIcon}
              selectedColor={selectedColor}
              selectedIcon={appIcon}
            />
            <MenuDivider />
          </>
        )}
        {moreActionItems.map((item: MenuItemProps) => {
          return <MenuItem key={item.text} {...item} />;
        })}
        <ForkApplicationModal
          applicationId={props.application.id}
          isModalOpen={isForkApplicationModalopen}
          setModalClose={setForkApplicationModalOpen}
        />
      </Menu>
    </ContextDropdownWrapper>
  );

  return (
    <NameWrapper
      className="t--application-card"
      hasReadPermission={hasReadPermission}
      isMenuOpen={isMenuOpen}
      onMouseEnter={() => {
        !isFetchingApplications && setShowOverlay(true);
      }}
      onMouseLeave={() => {
        // If the menu is not open, then setOverlay false
        // Set overlay false on outside click.
        !isMenuOpen && setShowOverlay(false);
      }}
      showOverlay={showOverlay}
    >
      <>
        <Wrapper
          backgroundColor={selectedColor}
          className={
            isFetchingApplications
              ? Classes.SKELETON
              : "t--application-card-background"
          }
          hasReadPermission={hasReadPermission}
          key={props.application.id}
        >
          <AppIcon name={appIcon} size={Size.large} />
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
                      className="t--application-edit-link"
                      fill
                      href={editApplicationURL}
                      icon={"edit"}
                      size={Size.medium}
                      text="Edit"
                    />
                  )}
                  {!isMenuOpen && (
                    <Button
                      category={Category.tertiary}
                      className="t--application-view-link"
                      fill
                      href={viewApplicationURL}
                      icon={"rocket"}
                      size={Size.medium}
                      text="LAUNCH"
                    />
                  )}
                </Control>
              </ApplicationImage>
            </div>
          )}
        </Wrapper>
        <AppNameWrapper
          className={isFetchingApplications ? Classes.SKELETON : ""}
          isFetching={isFetchingApplications}
          ref={appNameWrapperRef}
        >
          {isEllipsisActive(appNameWrapperRef?.current) ? (
            <TooltipComponent content={props.application.name} maxWidth="400px">
              {appNameText}
            </TooltipComponent>
          ) : (
            appNameText
          )}
        </AppNameWrapper>
      </>
    </NameWrapper>
  );
}

export default ApplicationCard;
