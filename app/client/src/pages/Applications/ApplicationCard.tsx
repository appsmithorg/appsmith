import React, {
  useEffect,
  useState,
  useContext,
  useCallback,
  useMemo,
} from "react";
import styled, { ThemeContext } from "styled-components";
import type { ApplicationPayload } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
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
import type { AppIconName } from "design-system-old";
import {
  ColorSelector,
  EditableText,
  EditInteractionKind,
  IconSelector,
  SavingState,
} from "design-system-old";
import type { MenuItemProps } from "design-system";
import {
  Button,
  Menu,
  Divider,
  MenuContent,
  MenuItem,
  MenuTrigger,
} from "design-system";
import { useDispatch, useSelector } from "react-redux";
import type {
  ApplicationPagePayload,
  UpdateApplicationPayload,
} from "@appsmith/api/ApplicationApi";
import {
  getIsSavingAppName,
  getIsErroredSavingAppName,
  getDeletingMultipleApps,
} from "@appsmith/selectors/applicationSelectors";
import ForkApplicationModal from "./ForkApplicationModal";
import { getExportAppAPIRoute } from "@appsmith/constants/ApiConstants";
import { builderURL, viewerURL } from "@appsmith/RouteBuilder";
import history from "utils/history";
import urlBuilder from "@appsmith/entities/URLRedirect/URLAssembly";
import { toast } from "design-system";
import { getAppsmithConfigs } from "@appsmith/configs";
import { addItemsInContextMenu } from "@appsmith/utils";
import { getCurrentUser } from "actions/authActions";
import Card from "components/common/Card";
import { generateEditedByText } from "./helpers";
import {
  NO_PERMISSION_TO_SELECT_FOR_DELETE,
  createMessage,
} from "@appsmith/constants/messages";

const { cloudHosting } = getAppsmithConfigs();

interface ApplicationCardProps {
  application: ApplicationPayload;
  share?: (applicationId: string) => void;
  delete?: (applicationId: string) => void;
  update?: (id: string, data: UpdateApplicationPayload) => void;
  enableImportExport?: boolean;
  isMobile?: boolean;
  isFetchingApplications: boolean;
  permissions?: {
    hasCreateNewApplicationPermission?: boolean;
    hasManageWorkspacePermissions?: boolean;
    canInviteToWorkspace?: boolean;
  };
  workspaceId: string;
}

const IconScrollWrapper = styled.div`
  position: relative;
  .t--icon-selected {
    background-color: var(--ads-v2-color-bg-muted);
    border: var(--ads-v2-border-color);
    svg {
      path {
        fill: var(--ads-v2-color-fg);
      }
    }
  }
  svg {
    path {
      fill: var(--ads-v2-color-fg);
    }
  }
`;

export interface ModifiedMenuItemProps extends MenuItemProps {
  key?: string;
  "data-testid"?: string;
}

const ContextMenuTrigger = styled(Button)<{ isHidden?: boolean }>`
  ${(props) => props.isHidden && "opacity: 0; visibility: hidden;"}
`;

export function ApplicationCard(props: ApplicationCardProps) {
  const { isFetchingApplications } = props;
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
  const [moreActionItems, setMoreActionItems] = useState<
    ModifiedMenuItemProps[]
  >([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isForkApplicationModalopen, setForkApplicationModalOpen] =
    useState(false);
  const [lastUpdatedValue, setLastUpdatedValue] = useState("");
  const dispatch = useDispatch();

  const applicationId = props.application?.id;
  const showGitBadge = props.application?.gitApplicationMetadata?.branchName;

  const deleteMultipleApplicationObject = useSelector(getDeletingMultipleApps);
  const isApplicationSelected =
    deleteMultipleApplicationObject.list?.includes(applicationId);
  const isEnabledMultipleSelection =
    !!deleteMultipleApplicationObject.list?.length;

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
        children: "Share",
        key: "share",
        startIcon: "share",
        "data-testid": "t--share",
      });
    }
    // add fork app option to menu
    if (hasEditPermission) {
      moreActionItems.push({
        onSelect: forkApplicationInitiate,
        children: "Fork",
        key: "fork",
        startIcon: "fork-2",
        "data-testid": "t--fork-app",
      });
    }
    if (!!props.enableImportExport && hasExportPermission) {
      moreActionItems.push({
        onSelect: exportApplicationAsJSONFile,
        children: "Export",
        key: "export",
        startIcon: "download",
        "data-testid": "t--export-app",
      });
    }
    const updatedMoreActionItems: ModifiedMenuItemProps[] =
      addItemsInContextMenu(
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

    const branchName = props.application.gitApplicationMetadata?.branchName;
    link.href = getExportAppAPIRoute(applicationId, branchName);
    link.id = id;
    document.body.appendChild(link);
    // @ts-expect-error: Types are not available
    if (!window.Cypress) {
      link.click();
    }
    setIsMenuOpen(false);
    toast.show(`Successfully exported ${props.application.name}`, {
      kind: "success",
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
    setIsDeleting(true);
    const updatedActionItems = [...moreActionItems];
    updatedActionItems.pop();
    updatedActionItems.push({
      onSelect: deleteApp,
      children: "Are you sure?",
      key: "areyousure",
      startIcon: "delete-bin-line",
      "data-testid": "t--delete",
    });
    setMoreActionItems(updatedActionItems);
  };
  const addDeleteOption = () => {
    if (props.delete && hasDeletePermission) {
      const index = moreActionItems.findIndex(
        (el) => el.startIcon === "delete-bin-line",
      );
      if (index >= 0) {
        moreActionItems.pop();
      }
      moreActionItems.push({
        onSelect: askForConfirmation,
        children: "Delete",
        key: "delete",
        startIcon: "delete-bin-line",
        "data-testid": "t--delete-confirm",
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

  const handleMenuOnClose = (open: boolean) => {
    if (!open && !isDeleting) {
      setIsMenuOpen(false);
      setShowOverlay(false);
      addDeleteOption();
      if (lastUpdatedValue && props.application.name !== lastUpdatedValue) {
        props.update &&
          props.update(applicationId, {
            name: lastUpdatedValue,
          });
      }
    } else {
      setIsMenuOpen(true);
      setIsDeleting(false);
    }
  };

  const contextMenu = (
    <>
      <Menu className="more" onOpenChange={handleMenuOnClose} open={isMenuOpen}>
        <MenuTrigger>
          <ContextMenuTrigger
            className="m-0.5"
            data-testid="t--application-card-context-menu"
            isHidden={isEnabledMultipleSelection}
            isIconButton
            kind="tertiary"
            size="sm"
            startIcon="context-menu"
          />
        </MenuTrigger>
        <MenuContent side="right" style={{ maxHeight: "unset" }}>
          {hasEditPermission && (
            <div
              onKeyDown={(e) => {
                // This is to prevent the Menu component to take focus away from the input
                // https://github.com/radix-ui/primitives/issues/1175
                e.stopPropagation();
              }}
            >
              <EditableText
                className="px-3 pt-2 pb-2 t--application-name"
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
            </div>
          )}
          {hasEditPermission && (
            <>
              <ColorSelector
                colorPalette={theme.colors.appCardColors}
                defaultValue={selectedColor}
                fill
                onSelect={updateColor}
              />
              <Divider />
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
              <Divider />
            </IconScrollWrapper>
          )}
          <div className="menu-items-wrapper">
            {moreActionItems.map((item: MenuItemProps) => {
              const { children, key, ...restMenuItem } = item;
              return (
                <MenuItem
                  {...restMenuItem}
                  className={
                    item.startIcon === "delete-bin-line" ? "error-menuitem" : ""
                  }
                  key={key}
                >
                  {children}
                </MenuItem>
              );
            })}
          </div>
        </MenuContent>
      </Menu>
      <ForkApplicationModal
        applicationId={applicationId}
        handleClose={() => {
          setForkApplicationModalOpen(false);
        }}
        isModalOpen={isForkApplicationModalopen}
      />
    </>
  );

  const editedByText = generateEditedByText({
    modifiedAt: props.application.modifiedAt,
    modifiedBy: props.application.modifiedBy,
  });

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

  const launchApp = useCallback(() => {
    setURLParams();
    history.push(
      viewerURL({
        pageId: props.application.defaultPageId,
        params,
      }),
    );
    dispatch(getCurrentUser());
  }, [props.application.defaultPageId]);

  const editApp = useCallback(() => {
    setURLParams();
    history.push(
      builderURL({
        pageId: props.application.defaultPageId,
        params,
      }),
    );
    dispatch(getCurrentUser());
  }, [props.application.defaultPageId]);

  const handleMultipleSelection = (event: any) => {
    if ((event as MouseEvent).ctrlKey || (event as MouseEvent).metaKey) {
      if (!hasDeletePermission) {
        toast.show(createMessage(NO_PERMISSION_TO_SELECT_FOR_DELETE), {
          kind: "error",
        });
        return;
      }
      dispatch({
        type: ReduxActionTypes.DELETE_MULTIPLE_APPS_TOGGLE,
        payload: { id: applicationId },
      });
    }
  };

  return (
    <Card
      backgroundColor={selectedColor}
      contextMenu={contextMenu}
      editedByText={editedByText}
      hasReadPermission={hasReadPermission}
      icon={appIcon}
      isContextMenuOpen={isMenuOpen}
      isFetching={isFetchingApplications}
      isMobile={props.isMobile}
      isSelected={!!isApplicationSelected}
      moreActionItems={moreActionItems}
      primaryAction={props.isMobile ? launchApp : handleMultipleSelection}
      setShowOverlay={setShowOverlay}
      showGitBadge={Boolean(showGitBadge)}
      showOverlay={showOverlay && !isEnabledMultipleSelection}
      testId="t--application-card"
      title={props.application.name}
      titleTestId="t--app-card-name"
    >
      {hasEditPermission && !isMenuOpen && (
        <Button
          className="t--application-edit-link"
          href={editModeURL}
          onClick={editApp}
          size="md"
          startIcon={"pencil-line"}
        >
          Edit
        </Button>
      )}
      {!isMenuOpen && (
        <Button
          className="t--application-view-link"
          href={viewModeURL}
          kind="secondary"
          onClick={launchApp}
          size="md"
          startIcon={"rocket"}
        >
          Launch
        </Button>
      )}
    </Card>
  );
}

export default ApplicationCard;
