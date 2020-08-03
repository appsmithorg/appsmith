import React from "react";
import styled from "styled-components";
import { Breadcrumbs, IBreadcrumbProps } from "@blueprintjs/core";
import { ApplicationPayload } from "constants/ReduxActionConstants";
import {
  BASE_URL,
  APPLICATIONS_URL,
  BUILDER_PAGE_URL,
  PAGE_LIST_EDITOR_URL,
} from "constants/routes";
import {
  PERMISSION_TYPE,
  isPermitted,
} from "pages/Applications/permissionHelpers";
import { Directions } from "utils/helpers";
import InviteUsersFormv2 from "pages/organization/InviteUsersFromv2";
import { PageListPayload } from "constants/ReduxActionConstants";
import Button from "components/editorComponents/Button";
import StyledHeader from "components/designSystems/appsmith/StyledHeader";
import CustomizedDropdown, {
  CustomizedDropdownProps,
} from "pages/common/CustomizedDropdown";
import {
  DropdownOnSelectActions,
  getOnSelectAction,
} from "pages/common/CustomizedDropdown/dropdownHelpers";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { Skin } from "constants/DefaultTheme";
import { HelpModal } from "components/designSystems/appsmith/help/HelpModal";
import { FormDialogComponent } from "components/editorComponents/form/FormDialogComponent";

const LoadingContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  flex-shrink: 1;
  margin: 0 10px;
`;

const PreviewPublishSection = styled.div`
  display: flex;
  justify-content: space-evenly;
  align-items: center;
  flex-shrink: 1;
`;

const StretchedBreadCrumb = styled(Breadcrumbs)`
  && {
    flex-shrink: 1;
    * {
      font-family: ${props => props.theme.fonts[0]};
      font-size: ${props => props.theme.fontSizes[2]}px;
    }
  }
`;

const ShareButton = styled.div`
  display: flex;
  flex-grow: 1;
  justify-content: flex-end;
`;

type EditorHeaderProps = {
  currentApplication?: ApplicationPayload;
  isSaving?: boolean;
  pageSaveError?: boolean;
  pageName?: string;
  onPublish: () => void;
  onCreatePage: (name: string) => void;
  pages?: PageListPayload;
  currentPageId?: string;
  isPublishing: boolean;
  publishedTime?: string;
  orgId: string;
  currentApplicationId?: string;
  createModal: () => void;
};
const navigation: IBreadcrumbProps[] = [
  { href: BASE_URL, icon: "home", text: "Home" },
  { href: APPLICATIONS_URL, icon: "folder-close", text: "Applications" },
  { icon: "page-layout", text: "", current: true },
];
export const EditorHeader = (props: EditorHeaderProps) => {
  const {
    currentApplication,
    isSaving,
    pageSaveError,
    onPublish,
    pages,
    currentPageId,
    isPublishing,
    orgId,
    currentApplicationId,
  } = props;

  const selectedPageName = pages?.find(page => page.pageId === currentPageId)
    ?.pageName;

  const pageSelectorData: CustomizedDropdownProps = {
    sections: [
      {
        isSticky: true,
        options: [
          {
            content: (
              <Button
                text="Manage Pages"
                icon="page-layout"
                iconAlignment={Directions.LEFT}
                skin={Skin.LIGHT}
              />
            ),
            onSelect: () =>
              getOnSelectAction(DropdownOnSelectActions.REDIRECT, {
                path: PAGE_LIST_EDITOR_URL(currentApplicationId, currentPageId),
              }),
          },
        ],
      },
      {
        options: pages
          ? pages.map(page => {
              const url = BUILDER_PAGE_URL(currentApplicationId, page.pageId);
              return {
                content: page.pageName,
                onSelect: () => {
                  AnalyticsUtil.logEvent("PAGE_SWITCH", {
                    pageName: page.pageName,
                    pageId: page.pageId,
                    mode: "EDIT",
                  });
                  getOnSelectAction(DropdownOnSelectActions.REDIRECT, {
                    path: url,
                  });
                },
                shouldCloseDropdown: true,
                active: page.pageId === currentPageId,
              };
            })
          : [],
      },
    ],
    trigger: {
      text: selectedPageName,
    },
    openDirection: Directions.BOTTOM,
    openOnHover: false,
  };

  let saveStatusMessage = "";
  if (isSaving) {
    saveStatusMessage = "Saving...";
  }
  if (!isSaving && !pageSaveError) {
    saveStatusMessage = "All changes saved";
  }
  const applicationPermissions = currentApplication?.userPermissions
    ? currentApplication.userPermissions
    : [];

  return (
    <StyledHeader>
      <StretchedBreadCrumb items={navigation} minVisibleItems={3} />
      <CustomizedDropdown {...pageSelectorData} />
      <ShareButton>
        {isPermitted(
          applicationPermissions,
          PERMISSION_TYPE.MANAGE_APPLICATION,
        ) && (
          <FormDialogComponent
            trigger={
              <Button
                text="Share"
                intent="primary"
                outline
                size="small"
                className="t--application-share-btn"
              />
            }
            Form={InviteUsersFormv2}
            orgId={orgId}
            applicationId={currentApplicationId}
            title={
              currentApplication ? currentApplication.name : "Share Application"
            }
          />
        )}
      </ShareButton>

      <LoadingContainer>{saveStatusMessage}</LoadingContainer>
      <PreviewPublishSection>
        <Button
          onClick={onPublish}
          text="Publish"
          loading={isPublishing}
          intent="primary"
          filled
          size="small"
          className="t--application-publish-btn"
        />
      </PreviewPublishSection>
      <HelpModal></HelpModal>
    </StyledHeader>
  );
};

export default EditorHeader;
