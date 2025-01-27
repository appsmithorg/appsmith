import React, {
  useEffect,
  useState,
  useContext,
  useCallback,
  useMemo,
} from "react";
import styled, { ThemeContext } from "styled-components";
import type { ApplicationPayload } from "entities/Application";
import {
  hasDeleteApplicationPermission,
  isPermitted,
  PERMISSION_TYPE,
} from "ee/utils/permissionHelpers";
import {
  getInitialsAndColorCode,
  getApplicationIcon,
  getRandomPaletteColor,
} from "utils/AppsmithUtils";
import type { AppIconName } from "@appsmith/ads-old";
import {
  ColorSelector,
  EditableText,
  EditInteractionKind,
  IconSelector,
  SavingState,
} from "@appsmith/ads-old";
import type { MenuItemProps } from "@appsmith/ads";
import {
  Button,
  Menu,
  Divider,
  MenuContent,
  MenuItem,
  MenuTrigger,
} from "@appsmith/ads";
import { useDispatch, useSelector } from "react-redux";
import type {
  ApplicationPagePayload,
  UpdateApplicationPayload,
} from "ee/api/ApplicationApi";
import {
  getIsSavingAppName,
  getIsErroredSavingAppName,
} from "ee/selectors/applicationSelectors";
import ForkApplicationModal from "./ForkApplicationModal";
import { getExportAppAPIRoute } from "ee/constants/ApiConstants";
import { builderURL, viewerURL } from "ee/RouteBuilder";
import history from "utils/history";
import urlBuilder from "ee/entities/URLRedirect/URLAssembly";
import { toast } from "@appsmith/ads";
import { getCurrentUser } from "actions/authActions";
import Card, { ContextMenuTrigger } from "components/common/Card";
import { generateEditedByText } from "./helpers";
import { noop } from "lodash";
import { getLatestGitBranchFromLocal } from "utils/storage";
import { getCurrentUser as getCurrentUserSelector } from "selectors/usersSelectors";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";

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
    border: var(--ads-v2-color-border);

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

export function ApplicationCard(props: ApplicationCardProps) {
  const { application, isFetchingApplications } = props;
  const theme = useContext(ThemeContext);
  const isSavingName = useSelector(getIsSavingAppName);
  const isErroredSavingName = useSelector(getIsErroredSavingAppName);
  const currentUser = useSelector(getCurrentUserSelector);
  const initialsAndColorCode = getInitialsAndColorCode(
    application.name,
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

  const applicationId = application.id;
  const baseApplicationId = application.baseId;
  const showGitBadge = application.gitApplicationMetadata?.branchName;
  const [editorParams, setEditorParams] = useState({});
  const isGitPersistBranchEnabled = useFeatureFlag(
    FEATURE_FLAG.release_git_persist_branch_enabled,
  );

  useEffect(() => {
    (async () => {
      const storedLatestBranch = await getLatestGitBranchFromLocal(
        currentUser?.email ?? "",
        baseApplicationId,
      );

      if (isGitPersistBranchEnabled && storedLatestBranch) {
        setEditorParams({ branch: storedLatestBranch });
      } else if (showGitBadge) {
        setEditorParams({ branch: showGitBadge });
      }
    })();
  }, [
    baseApplicationId,
    currentUser?.email,
    showGitBadge,
    isGitPersistBranchEnabled,
  ]);

  const viewerParams = useMemo(() => {
    if (showGitBadge) {
      return { branch: showGitBadge };
    } else {
      return {};
    }
  }, [showGitBadge]);

  useEffect(() => {
    let colorCode;

    if (application.color) {
      colorCode = application.color;
    } else {
      colorCode = getRandomPaletteColor(theme.colors.appCardColors);
    }

    setSelectedColor(colorCode);
  }, [application.color]);

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

    setMoreActionItems(moreActionItems);
    addDeleteOption();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const appIcon = (application.icon ||
    getApplicationIcon(applicationId)) as AppIconName;
  const hasEditPermission = isPermitted(
    application.userPermissions ?? [],
    PERMISSION_TYPE.MANAGE_APPLICATION,
  );
  const hasReadPermission = isPermitted(
    application.userPermissions ?? [],
    PERMISSION_TYPE.READ_APPLICATION,
  );
  const hasExportPermission = isPermitted(
    application.userPermissions ?? [],
    PERMISSION_TYPE.EXPORT_APPLICATION,
  );
  const hasDeletePermission = hasDeleteApplicationPermission(
    application.userPermissions,
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

    const branchName = application.gitApplicationMetadata?.branchName;

    link.href = getExportAppAPIRoute(applicationId, branchName);
    link.id = id;
    document.body.appendChild(link);

    // @ts-expect-error: Types are not available
    if (!window.Cypress) {
      link.click();
    }

    setIsMenuOpen(false);
    toast.show(`Successfully exported ${application.name}`, {
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

  if (initials.length < 2 && application.name.length > 1) {
    initials += application.name[1].toUpperCase() || "";
  }

  const handleMenuOnClose = (open: boolean) => {
    if (!open && !isDeleting) {
      setIsMenuOpen(false);
      setShowOverlay(false);
      addDeleteOption();

      if (lastUpdatedValue && application.name !== lastUpdatedValue) {
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
                defaultValue={application.name}
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
    modifiedAt: application.modifiedAt,
    modifiedBy: application.modifiedBy,
  });

  const setURLParams = useCallback(() => {
    const page: ApplicationPagePayload | undefined = application.pages.find(
      (page) => page.id === application.defaultPageId,
    );

    if (!page) return;

    urlBuilder.updateURLParams(
      {
        applicationSlug: application.slug,
        applicationVersion: application.applicationVersion,
        baseApplicationId: application.baseId,
      },
      application.pages.map((page) => ({
        pageSlug: page.slug,
        customSlug: page.customSlug,
        basePageId: page.baseId,
      })),
    );
  }, [
    application.applicationVersion,
    application.baseId,
    application.defaultPageId,
    application.pages,
    application.slug,
  ]);

  const editModeURL = useMemo(() => {
    const basePageId = application.defaultBasePageId;

    if (!basePageId) return "";

    return builderURL({ basePageId, params: editorParams });
  }, [application.defaultBasePageId, editorParams]);

  const viewModeURL = useMemo(() => {
    const basePageId = application.defaultBasePageId;

    if (!basePageId) return "";

    return viewerURL({ basePageId, params: viewerParams });
  }, [application.defaultBasePageId, viewerParams]);

  const launchApp = useCallback(
    (e: React.MouseEvent) => {
      if (e.ctrlKey || e.metaKey) {
        window.open(viewModeURL, "_blank");

        return;
      }

      setURLParams();
      history.push(viewModeURL);
      dispatch(getCurrentUser());
    },
    [dispatch, setURLParams, viewModeURL],
  );

  const editApp = useCallback(
    (e: React.MouseEvent) => {
      if (e.ctrlKey || e.metaKey) {
        window.open(editModeURL, "_blank");

        return;
      }

      setURLParams();
      history.push(editModeURL);
      dispatch(getCurrentUser());
    },
    [dispatch, editModeURL, setURLParams],
  );

  const launchMobileApp = useCallback(() => {
    setURLParams();
    history.push(viewModeURL);
    dispatch(getCurrentUser());
  }, [setURLParams, viewModeURL, dispatch]);

  return (
    <Card
      backgroundColor={selectedColor}
      contextMenu={contextMenu}
      editedByText={editedByText}
      hasEditPermission={hasEditPermission}
      hasReadPermission={hasReadPermission}
      icon={appIcon}
      isContextMenuOpen={isMenuOpen}
      isFetching={isFetchingApplications}
      isMobile={props.isMobile}
      moreActionItems={moreActionItems}
      primaryAction={props.isMobile ? launchMobileApp : noop}
      setShowOverlay={setShowOverlay}
      showGitBadge={Boolean(showGitBadge)}
      showOverlay={showOverlay}
      testId={`t--application-card ${application.name}`}
      title={application.name}
      titleTestId="t--app-card-name"
    >
      {hasEditPermission && !isMenuOpen && (
        <Button
          className="t--application-edit-link"
          onClick={editApp}
          renderAs="a"
          size="md"
          startIcon={"pencil-line"}
        >
          Edit
        </Button>
      )}
      {!isMenuOpen && (
        <Button
          className="t--application-view-link"
          kind="secondary"
          onClick={launchApp}
          renderAs="a"
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
