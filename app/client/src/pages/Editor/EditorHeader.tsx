import React from "react";
import styled from "styled-components";
import moment from "moment";
import {
  Breadcrumbs,
  IBreadcrumbProps,
  Tooltip,
  Position,
} from "@blueprintjs/core";
import {
  BASE_URL,
  APPLICATIONS_URL,
  BUILDER_PAGE_URL,
  PAGE_LIST_EDITOR_URL,
} from "constants/routes";
import { Directions } from "utils/helpers";

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

const LoadingContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  flex-grow: 1;
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

type EditorHeaderProps = {
  isSaving?: boolean;
  pageName?: string;
  onPublish: () => void;
  onCreatePage: (name: string) => void;
  pages?: PageListPayload;
  currentPageId?: string;
  isPublishing: boolean;
  publishedTime?: string;
  currentApplicationId?: string;
  createModal: () => void;
};
const navigation: IBreadcrumbProps[] = [
  { href: BASE_URL, icon: "home", text: "Home" },
  { href: APPLICATIONS_URL, icon: "folder-close", text: "Applications" },
  { icon: "page-layout", text: "", current: true },
];
export const EditorHeader = (props: EditorHeaderProps) => {
  const selectedPageName = props.pages?.find(
    page => page.pageId === props.currentPageId,
  )?.pageName;

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
                iconAlignment="left"
              />
            ),
            onSelect: () =>
              getOnSelectAction(DropdownOnSelectActions.REDIRECT, {
                path: PAGE_LIST_EDITOR_URL(
                  props.currentApplicationId,
                  props.currentPageId,
                ),
              }),
          },
        ],
      },
      {
        options: props.pages
          ? props.pages.map(page => {
              const url = BUILDER_PAGE_URL(
                props.currentApplicationId,
                page.pageId,
              );
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
                active: page.pageId === props.currentPageId,
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

  return (
    <StyledHeader>
      <StretchedBreadCrumb items={navigation} minVisibleItems={3} />
      <CustomizedDropdown {...pageSelectorData} />

      <LoadingContainer>
        {props.isSaving ? "Saving..." : "All changes saved"}
      </LoadingContainer>
      <PreviewPublishSection>
        <Tooltip
          disabled={!props.publishedTime}
          content={
            props.publishedTime
              ? `Last published ${moment(props.publishedTime).fromNow()}`
              : ""
          }
          position={Position.LEFT}
        >
          <Button
            onClick={props.onPublish}
            text="Publish"
            loading={props.isPublishing}
            intent="primary"
            filled
            size="small"
            className="t--application-publish-btn"
          />
        </Tooltip>
      </PreviewPublishSection>
    </StyledHeader>
  );
};

export default EditorHeader;
