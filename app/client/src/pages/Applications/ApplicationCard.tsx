import React, {
  useEffect,
  useState,
  useRef,
  useContext,
  useCallback,
  useMemo,
} from "react";
import styled, { ThemeContext } from "styled-components";
import type { HTMLDivProps, ICardProps } from "@blueprintjs/core";
import { Card, Classes, Position } from "@blueprintjs/core";
import type { ApplicationPayload } from "@appsmith/constants/ReduxActionConstants";
import {
  hasDeleteApplicationPermission,
  isPermitted,
  PERMISSION_TYPE,
} from "@appsmith/utils/permissionHelpers";
import {
  getInitialsAndColorCode,
  getApplicationIcon,
  getRandomPaletteColor,
} from "utils/AppsmithUtils";
import { noop, omit } from "lodash";
import type { AppIconName, MenuItemProps } from "design-system-old";
import {
  AppIcon,
  Button,
  Category,
  Classes as CsClasses,
  ColorSelector,
  EditableText,
  EditInteractionKind,
  IconPositions,
  Icon,
  IconSelector,
  IconSize,
  Menu,
  MenuDivider,
  MenuItem,
  SavingState,
  Size,
  Toaster,
  Text,
  TextType,
  TooltipComponent,
  Variant,
} from "design-system-old";
import { useSelector } from "react-redux";
import type {
  ApplicationPagePayload,
  UpdateApplicationPayload,
} from "@appsmith/api/ApplicationApi";
import {
  getIsFetchingApplications,
  getIsSavingAppName,
  getIsErroredSavingAppName,
} from "@appsmith/selectors/applicationSelectors";
import { truncateString, howMuchTimeBeforeText } from "utils/helpers";
import ForkApplicationModal from "./ForkApplicationModal";
import { getExportAppAPIRoute } from "@appsmith/constants/ApiConstants";
import { Colors } from "constants/Colors";
import { CONNECTED_TO_GIT, createMessage } from "@appsmith/constants/messages";
import { builderURL, viewerURL } from "RouteBuilder";
import history from "utils/history";
import urlBuilder from "entities/URLRedirect/URLAssembly";
import { getAppsmithConfigs } from "@appsmith/configs";
import { addItemsInContextMenu } from "@appsmith/utils";

const { cloudHosting } = getAppsmithConfigs();

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
    padding: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  ${(props) =>
    props.showOverlay &&
    `
      {
        justify-content: center;
        align-items: center;

        .overlay {
          position: relative;
          ${
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
                display: flex;
                flex-direction: row;
                z-index: 1;

                & .t--application-view-link {
                  border: 2px solid ${Colors.BLACK};
                  background-color: ${Colors.BLACK};
                  color: ${Colors.WHITE};
                }

                & .t--application-view-link:hover {
                  background-color: transparent;
                  border: 2px solid ${Colors.BLACK};
                  color: ${Colors.BLACK};

                  svg {
                    path {
                      fill: currentColor;
                    }
                  }
                }

                & .t--application-edit-link, & .t--application-view-link {
                  span {
                    margin-right: 2px;

                    svg {
                      width: 16px;
                      height: 16px;
                      path {
                        fill: currentColor;
                      }
                    }
                  }
                }
              }`
          }

          & div.overlay-blur {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: ${
              props.hasReadPermission && !props.isMenuOpen
                ? `rgba(255, 255, 255, 0.5)`
                : null
            };
            @supports ((-webkit-backdrop-filter: none) or (backdrop-filter: none)) {
              background-color: transparent;
              backdrop-filter: ${
                props.hasReadPermission && !props.isMenuOpen
                  ? `blur(6px)`
                  : null
              };
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
      isMobile?: boolean;
    },
  ) => (
    <Card
      {...omit(props, ["hasReadPermission", "backgroundColor", "isMobile"])}
    />
  ),
)`
  display: flex;
  flex-direction: row-reverse;
  justify-content: center;
  width: ${(props) => props.theme.card.minWidth}px;
  height: ${(props) => props.theme.card.minHeight}px;
  position: relative;
  background-color: ${(props) => props.backgroundColor};
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

  ${({ isMobile }) =>
    isMobile &&
    `
    width: 100% !important;
    height: 126px !important;
  `}
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
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  gap: 8px;
  align-items: center;

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
  display: flex;
  align-items: center;
  justify-content: center;
`;

const AppNameWrapper = styled.div<{ isFetching: boolean }>`
  padding: 0;
  padding-right: 12px;
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
  flex: 1;

  .bp3-popover-target {
    display: inline;
  }
`;

type ApplicationCardProps = {
  application: ApplicationPayload;
  duplicate?: (applicationId: string) => void;
  share?: (applicationId: string) => void;
  delete?: (applicationId: string) => void;
  update?: (id: string, data: UpdateApplicationPayload) => void;
  enableImportExport?: boolean;
  isMobile?: boolean;
  permissions?: {
    hasCreateNewApplicationPermission?: boolean;
    hasManageWorkspacePermissions?: boolean;
    canInviteToWorkspace?: boolean;
  };
  workspaceId: string;
};

const EditButton = styled(Button)`
  margin-bottom: 0;
`;

const ContextDropdownWrapper = styled.div``;

const CircleAppIcon = styled(AppIcon)`
  padding: 12px;
  background-color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0px 2px 16px rgba(0, 0, 0, 0.07);
  border-radius: 50%;

  svg {
    width: 100%;
    height: 100%;
    path {
      fill: #000 !important;
    }
  }
`;

const ModifiedDataComponent = styled.div`
  font-size: 13px;
  color: #8a8a8a;
  &::first-letter {
    text-transform: uppercase;
  }
`;

const CardFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 4px;
`;

const IconScrollWrapper = styled.div`
  position: relative;
  .t--icon-selected {
    background-color: rgba(248, 106, 43, 0.2);
    border: 1px solid ${(props) => props.theme.colors.applications.cardMenuIcon};
    svg {
      path {
        fill: ${(props) => props.theme.colors.applications.iconColor};
      }
    }
  }
  .icon-selector::-webkit-scrollbar-thumb {
    background-color: transparent;
  }
  .icon-selector::-webkit-scrollbar {
    width: 0px;
  }
`;

const MenuItemWrapper = styled(MenuItem)`
  &.error-menuitem {
    .${CsClasses.TEXT} {
      color: ${Colors.DANGER_SOLID};
    }
    .${CsClasses.ICON} {
      svg {
        fill: ${Colors.DANGER_SOLID};
        path {
          fill: ${Colors.DANGER_SOLID};
        }
      }
    }
  }

  .${CsClasses.ICON} {
    svg {
      width: 18px;
      height: 18px;
    }
  }
`;

const StyledGitConnectedBadge = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  top: -12px;
  right: -12px;
  box-shadow: 0px 2px 16px rgba(0, 0, 0, 0.07);
  background: ${Colors.WHITE};
`;

function GitConnectedBadge() {
  return (
    <StyledGitConnectedBadge>
      <TooltipComponent
        content={createMessage(CONNECTED_TO_GIT)}
        maxWidth="400px"
      >
        <Icon fillColor={Colors.GREY_7} name="fork" size={IconSize.XXL} />
      </TooltipComponent>
    </StyledGitConnectedBadge>
  );
}

const Container = styled.div<{ isMobile?: boolean }>`
  position: relative;
  overflow: visible;
  ${({ isMobile }) => isMobile && `width: 100%;`}
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
  const [isForkApplicationModalopen, setForkApplicationModalOpen] =
    useState(false);
  const [lastUpdatedValue, setLastUpdatedValue] = useState("");
  const appNameWrapperRef = useRef<HTMLDivElement>(null);

  const applicationId = props.application?.id;
  const showGitBadge = props.application?.gitApplicationMetadata?.branchName;

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
    if (
      props.duplicate &&
      props.permissions?.hasCreateNewApplicationPermission &&
      hasEditPermission
    ) {
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
        icon: "fork-2",
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
    const updatedMoreActionItems: MenuItemProps[] = addItemsInContextMenu(
      [
        props.permissions?.hasManageWorkspacePermissions || false,
        props.permissions?.canInviteToWorkspace || false,
        !cloudHosting,
      ],
      history,
      props.workspaceId,
      moreActionItems,
    );
    setMoreActionItems(updatedMoreActionItems);
    addDeleteOption();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const appIcon = (props.application?.icon ||
    getApplicationIcon(applicationId)) as AppIconName;
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
  const hasDeletePermission = hasDeleteApplicationPermission(
    props.application?.userPermissions,
  );

  const updateColor = (color: string) => {
    setSelectedColor(color);
    props.update &&
      props.update(applicationId, {
        color: color,
      });
  };
  const updateIcon = (icon: AppIconName) => {
    props.update &&
      props.update(applicationId, {
        icon: icon,
      });
  };
  const duplicateApp = () => {
    props.duplicate && props.duplicate(applicationId);
  };
  const shareApp = () => {
    props.share && props.share(applicationId);
  };
  const exportApplicationAsJSONFile = () => {
    // export api response comes with content-disposition header.
    // there is no straightforward way to handle it with axios/fetch
    const id = `t--export-app-link`;
    const existingLink = document.getElementById(id);
    existingLink && existingLink.remove();
    const link = document.createElement("a");

    link.href = getExportAppAPIRoute(applicationId);
    link.id = id;
    document.body.appendChild(link);
    // @ts-expect-error: Types are not available
    if (!window.Cypress) {
      link.click();
    }
    setIsMenuOpen(false);
    Toaster.show({
      text: `Successfully exported ${props.application.name}`,
      variant: Variant.success,
    });
  };
  const forkApplicationInitiate = () => {
    // open fork application modal
    // on click on an workspace, create app and take to app
    setForkApplicationModalOpen(true);
  };
  const deleteApp = () => {
    setShowOverlay(false);
    props.delete && props.delete(applicationId);
  };
  const askForConfirmation = () => {
    const updatedActionItems = [...moreActionItems];
    updatedActionItems.pop();
    updatedActionItems.push({
      onSelect: deleteApp,
      text: "Are you sure?",
      icon: "delete-blank",
      type: "warning",
      cypressSelector: "t--delete",
    });
    setMoreActionItems(updatedActionItems);
  };
  const addDeleteOption = () => {
    if (props.delete && hasDeletePermission) {
      const index = moreActionItems.findIndex(
        (el) => el.icon === "delete-blank",
      );
      if (index >= 0) {
        moreActionItems.pop();
      }
      moreActionItems.push({
        onSelect: askForConfirmation,
        text: "Delete",
        icon: "delete-blank",
        cypressSelector: "t--delete-confirm",
      });
      setMoreActionItems(moreActionItems);
    }
  };
  if (initials.length < 2 && props.application.name.length > 1) {
    initials += props.application.name[1].toUpperCase() || "";
  }

  // should show correct branch of application when edit mode
  const params: any = {};
  if (showGitBadge) {
    params.branch = showGitBadge;
  }

  const appNameText = (
    <Text cypressSelector="t--app-card-name" type={TextType.H3}>
      {props.application.name}
    </Text>
  );

  const ContextMenu = (
    <ContextDropdownWrapper>
      <Menu
        autoFocus={false}
        className="more"
        onClosing={() => {
          setIsMenuOpen(false);
          setShowOverlay(false);
          addDeleteOption();
          if (lastUpdatedValue && props.application.name !== lastUpdatedValue) {
            props.update &&
              props.update(applicationId, {
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
            <Icon
              fillColor={isMenuOpen ? "#000" : "#8a8a8a"}
              hoverFillColor="#000"
              name="context-menu"
              size={IconSize.XXXL}
            />
          </MoreOptionsContainer>
        }
      >
        {hasEditPermission && (
          <EditableText
            className="px-3 pt-3 pb-2 t--application-name"
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
                props.update(applicationId, {
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
          <IconScrollWrapper>
            <IconSelector
              className="icon-selector"
              fill
              onSelect={updateIcon}
              selectedColor={theme.colors.applications.cardMenuIcon}
              selectedIcon={appIcon}
            />
            <MenuDivider />
          </IconScrollWrapper>
        )}
        {moreActionItems.map((item: MenuItemProps) => {
          return (
            <MenuItemWrapper
              key={item.text}
              {...item}
              className={item.icon === "delete-blank" ? "error-menuitem" : ""}
            />
          );
        })}
        <ForkApplicationModal
          applicationId={applicationId}
          isModalOpen={isForkApplicationModalopen}
          setModalClose={setForkApplicationModalOpen}
        />
      </Menu>
    </ContextDropdownWrapper>
  );

  const editedByText = () => {
    let editedBy = props.application.modifiedBy
      ? props.application.modifiedBy
      : "";
    let editedOn = props.application.modifiedAt
      ? props.application.modifiedAt
      : "";

    if (editedBy === "" && editedOn === "") return "";

    editedBy = editedBy.split("@")[0];
    editedBy = truncateString(editedBy, 9);

    //assuming modifiedAt will be always available
    editedOn = howMuchTimeBeforeText(editedOn);
    editedOn = editedOn !== "" ? editedOn + " ago" : "";
    return editedBy + " edited " + editedOn;
  };

  function setURLParams() {
    const page: ApplicationPagePayload | undefined =
      props.application.pages.find(
        (page) => page.id === props.application.defaultPageId,
      );
    if (!page) return;
    urlBuilder.updateURLParams(
      {
        applicationSlug: props.application.slug,
        applicationVersion: props.application.applicationVersion,
        applicationId: props.application.id,
      },
      props.application.pages.map((page) => ({
        pageSlug: page.slug,
        customSlug: page.customSlug,
        pageId: page.id,
      })),
    );
  }

  const editModeURL = useMemo(() => {
    if (!props.application.defaultPageId) return "";
    return builderURL({
      pageId: props.application.defaultPageId,
      params,
    });
  }, [props.application.defaultPageId, params]);

  const viewModeURL = useMemo(() => {
    if (!props.application.defaultPageId) return "";
    return viewerURL({
      pageId: props.application.defaultPageId,
      params,
    });
  }, [props.application.defaultPageId, params]);

  const launchApp = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setURLParams();
      history.push(
        viewerURL({
          pageId: props.application.defaultPageId,
          params,
        }),
      );
    },
    [props.application.defaultPageId],
  );

  const editApp = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setURLParams();
      history.push(
        builderURL({
          pageId: props.application.defaultPageId,
          params,
        }),
      );
    },
    [props.application.defaultPageId],
  );

  return (
    <Container
      isMobile={props.isMobile}
      onClick={props.isMobile ? launchApp : noop}
    >
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
        <Wrapper
          backgroundColor={selectedColor}
          className={
            isFetchingApplications
              ? Classes.SKELETON
              : "t--application-card-background"
          }
          hasReadPermission={hasReadPermission}
          isMobile={props.isMobile}
          key={props.application.id}
        >
          <CircleAppIcon name={appIcon} size={Size.large} />
          <AppNameWrapper
            className={isFetchingApplications ? Classes.SKELETON : ""}
            isFetching={isFetchingApplications}
            ref={appNameWrapperRef}
          >
            {appNameText}
          </AppNameWrapper>
          {showOverlay && !props.isMobile && (
            <div className="overlay">
              <div className="overlay-blur" />
              <ApplicationImage className="image-container">
                <Control className="control">
                  {hasEditPermission && !isMenuOpen && (
                    <EditButton
                      className="t--application-edit-link"
                      fill
                      href={editModeURL}
                      icon={"edit"}
                      iconPosition={IconPositions.left}
                      onClick={editApp}
                      size={Size.medium}
                      text="Edit"
                    />
                  )}
                  {!isMenuOpen && (
                    <Button
                      category={Category.secondary}
                      className="t--application-view-link"
                      fill
                      href={viewModeURL}
                      icon={"rocket"}
                      iconPosition={IconPositions.left}
                      onClick={launchApp}
                      size={Size.medium}
                      text="Launch"
                    />
                  )}
                </Control>
              </ApplicationImage>
            </div>
          )}
        </Wrapper>
        <CardFooter>
          <ModifiedDataComponent>{editedByText()}</ModifiedDataComponent>
          {!!moreActionItems.length && !props.isMobile && ContextMenu}
        </CardFooter>
      </NameWrapper>
      {showGitBadge && <GitConnectedBadge />}
    </Container>
  );
}

export default ApplicationCard;
