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
import { TabComponent, TabProp } from "components/ads/Tabs";
import { MenuItemProps } from "design-system";
import styled from "styled-components";

import MemberSettings from "./Members";
import { GeneralSettings } from "./General";
import * as Sentry from "@sentry/react";
import { getAllApplications } from "actions/applicationActions";
import { useMediaQuery } from "react-responsive";
import { BackButton, TabsWrapper } from "components/utils/helperComponents";
import { debounce } from "lodash";
import FormDialogComponent from "components/editorComponents/form/FormDialogComponent";
import WorkspaceInviteUsersForm from "./WorkspaceInviteUsersForm";
import { SettingsPageHeader } from "./SettingsPageHeader";
import { navigateToTab } from "./helpers";

const SentryRoute = Sentry.withSentryRouting(Route);

const SettingsWrapper = styled.div<{
  isMobile?: boolean;
}>`
  width: ${(props) => (props.isMobile ? "345px" : "916px")};
  margin: 0 auto;
  padding-top: 24px;
`;

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

  const onButtonClick = () => {
    setShowModal(true);
  };

  useEffect(() => {
    if (currentWorkspace) {
      setPageTitle(`Members in ${currentWorkspace.name}`);
    }
  }, [currentWorkspace]);

  useEffect(() => {
    if (!currentWorkspace) {
      dispatch(getAllApplications());
    }
  }, [dispatch, currentWorkspace]);

  const SettingsRenderer = (
    <>
      <SentryRoute
        component={GeneralSettings}
        location={location}
        path={`${path}/general`}
      />
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
    </>
  );

  const onSearch = debounce((search: string) => {
    if (search.trim().length > 0) {
      setSearchValue(search);
    } else {
      setSearchValue("");
    }
  }, 300);

  const tabArr: TabProp[] = [
    {
      key: "members",
      title: "Members",
      panelComponent: SettingsRenderer,
      // icon: "gear",
      // iconSize: IconSize.XL,
    },
    {
      key: "general",
      title: "General Settings",
      panelComponent: SettingsRenderer,
      // icon: "user-2",
      // iconSize: IconSize.XL,
    },
  ];

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

  const isMembersPage = location.pathname.indexOf("members") !== -1;
  const isMobile: boolean = useMediaQuery({ maxWidth: 767 });
  return (
    <>
      <SettingsWrapper data-testid="t--settings-wrapper" isMobile={isMobile}>
        <BackButton goTo="/applications" />
        <SettingsPageHeader
          buttonText="Add users"
          onButtonClick={onButtonClick}
          onSearch={onSearch}
          pageMenuItems={pageMenuItems}
          searchPlaceholder="Search"
          showMoreOptions={false}
          title={pageTitle}
        />
        <TabsWrapper data-testid="t--user-edit-tabs-wrapper">
          <TabComponent
            onSelect={(index: number) =>
              navigateToTab(tabArr[index].key, location, history)
            }
            selectedIndex={isMembersPage ? 0 : 1}
            tabs={tabArr}
          />
        </TabsWrapper>
      </SettingsWrapper>
      <FormDialogComponent
        Form={WorkspaceInviteUsersForm}
        canOutsideClickClose
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={`Invite Users to ${currentWorkspace?.name}`}
        trigger
        workspaceId={workspaceId}
      />
    </>
  );
}
