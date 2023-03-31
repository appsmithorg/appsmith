import React, { useCallback, useEffect, useState } from "react";
import {
  useRouteMatch,
  useLocation,
  useParams,
  Route,
  useHistory,
} from "react-router-dom";
import { getCurrentWorkspace } from "@appsmith/selectors/workspaceSelectors";
import { useSelector, useDispatch } from "react-redux";
import type { MenuItemProps, TabProp } from "design-system-old";
import { TabComponent } from "design-system-old";
import styled from "styled-components";

import MemberSettings from "@appsmith/pages/workspace/Members";
import { GeneralSettings } from "./General";
import * as Sentry from "@sentry/react";
import {
  getAllApplications,
  setShowAppInviteUsersDialog,
} from "@appsmith/actions/applicationActions";
import { useMediaQuery } from "react-responsive";
import { BackButton, StickyHeader } from "components/utils/helperComponents";
import { debounce } from "lodash";
import FormDialogComponent from "components/editorComponents/form/FormDialogComponent";
import WorkspaceInviteUsersForm from "@appsmith/pages/workspace/WorkspaceInviteUsersForm";
import { SettingsPageHeader } from "./SettingsPageHeader";
import { navigateToTab } from "@appsmith/pages/workspace/helpers";
import {
  isPermitted,
  PERMISSION_TYPE,
} from "@appsmith/utils/permissionHelpers";
import {
  createMessage,
  INVITE_USERS_PLACEHOLDER,
  SEARCH_USERS,
} from "@appsmith/constants/messages";
import { getAppsmithConfigs } from "@appsmith/configs";

const { cloudHosting } = getAppsmithConfigs();

const SentryRoute = Sentry.withSentryRouting(Route);

const SettingsWrapper = styled.div<{
  isMobile?: boolean;
}>`
  width: ${(props) => (props.isMobile ? "345px" : "916px")};
  margin: 0 auto;
  height: 100%;
  &::-webkit-scrollbar {
    width: 0px;
  }
  .tabs-wrapper {
    height: 100%;
    ${({ isMobile }) =>
      !isMobile &&
      `
      padding: 104px 0 0;
  `}
  }
`;

const StyledStickyHeader = styled(StickyHeader)<{ isMobile?: boolean }>`
  padding-top: 24px;
  ${({ isMobile }) =>
    !isMobile &&
    `
  top: 48px;
  position: fixed;
  width: 916px;
  `}
`;

export const TabsWrapper = styled.div`
  .react-tabs {
    margin-left: 8px;
  }
  .react-tabs__tab-list {
    border-bottom: 1px solid var(--appsmith-color-black-200);
    padding: 36px 0 0;
    width: 908px;
  }
  .react-tabs__tab-panel {
    height: calc(100% - 76px);
  }
`;

enum TABS {
  GENERAL = "general",
  MEMBERS = "members",
}

export default function Settings() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const currentWorkspace = useSelector(getCurrentWorkspace).filter(
    (el) => el.id === workspaceId,
  )[0];
  const { path } = useRouteMatch();
  const location = useLocation();
  const dispatch = useDispatch();

  const [showModal, setShowModal] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const [pageTitle, setPageTitle] = useState<string>("");

  const history = useHistory();

  const currentTab = location.pathname.split("/").pop();

  const onButtonClick = () => {
    setShowModal(true);
  };

  useEffect(() => {
    if (currentWorkspace) {
      setPageTitle(`${currentWorkspace?.name}`);
    }
  }, [currentWorkspace]);

  useEffect(() => {
    if (!currentWorkspace) {
      dispatch(getAllApplications());
    }
  }, [dispatch, currentWorkspace]);

  const handleFormOpenOrClose = useCallback((isOpen: boolean) => {
    dispatch(setShowAppInviteUsersDialog(isOpen));
  }, []);

  const GeneralSettingsComponent = (
    <SentryRoute
      component={GeneralSettings}
      location={location}
      path={`${path}/general`}
    />
  );

  const MemberSettingsComponent = (
    <SentryRoute
      component={useCallback(
        (props: any) => (
          <MemberSettings {...props} searchValue={searchValue} />
        ),
        [location, searchValue],
      )}
      location={location}
      path={`${path}/members`}
    />
  );

  const onSearch = debounce((search: string) => {
    if (search.trim().length > 0) {
      setSearchValue(search);
    } else {
      setSearchValue("");
    }
  }, 300);

  const isMemberofTheWorkspace = isPermitted(
    currentWorkspace?.userPermissions || [],
    PERMISSION_TYPE.INVITE_USER_TO_WORKSPACE,
  );

  const tabArr: TabProp[] = [
    isMemberofTheWorkspace && {
      key: "members",
      title: "Members",
      panelComponent: MemberSettingsComponent,
      // icon: "gear",
      // iconSize: IconSize.XL,
    },
    {
      key: "general",
      title: "General Settings",
      panelComponent: GeneralSettingsComponent,
      // icon: "user-2",
      // iconSize: IconSize.XL,
    },
  ].filter(Boolean) as TabProp[];

  const pageMenuItems: MenuItemProps[] = [
    {
      icon: "book-line",
      className: "documentation-page-menu-item",
      onSelect: () => {
        /*console.log("hello onSelect")*/
      },
      text: "Documentation",
    },
  ];

  const isMembersPage = tabArr.length > 1 && currentTab === TABS.MEMBERS;
  const isGeneralPage = tabArr.length === 1 && currentTab === TABS.GENERAL;

  const isMobile: boolean = useMediaQuery({ maxWidth: 767 });
  return (
    <>
      <SettingsWrapper data-testid="t--settings-wrapper" isMobile={isMobile}>
        <StyledStickyHeader isMobile={isMobile}>
          <BackButton goTo="/applications" />
          <SettingsPageHeader
            buttonText="Add users"
            onButtonClick={onButtonClick}
            onSearch={onSearch}
            pageMenuItems={pageMenuItems}
            searchPlaceholder={createMessage(SEARCH_USERS, cloudHosting)}
            showMoreOptions={false}
            showSearchNButton={isMembersPage}
            title={pageTitle}
          />
        </StyledStickyHeader>
        <TabsWrapper
          className="tabs-wrapper"
          data-testid="t--user-edit-tabs-wrapper"
        >
          <TabComponent
            onSelect={(index: number) =>
              navigateToTab(tabArr[index].key, location, history)
            }
            selectedIndex={isMembersPage ? 0 : isGeneralPage ? 0 : 1}
            tabs={tabArr}
          />
        </TabsWrapper>
      </SettingsWrapper>
      <FormDialogComponent
        Form={WorkspaceInviteUsersForm}
        canOutsideClickClose
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onOpenOrClose={handleFormOpenOrClose}
        placeholder={createMessage(INVITE_USERS_PLACEHOLDER, cloudHosting)}
        title={`Invite Users to ${currentWorkspace?.name}`}
        trigger
        workspaceId={workspaceId}
      />
    </>
  );
}
