import React from "react";
import styled from "styled-components";
import { Breadcrumbs, IBreadcrumbProps, Spinner } from "@blueprintjs/core";
import DropdownComponent from "../../components/editor/DropdownComponent";
import { PageListPayload } from "../../constants/ReduxActionConstants";
import { DropdownOption } from "../../common/DropdownOption";
import { BaseButton } from "../../components/blueprint/ButtonComponent";
import StyledHeader from "../../components/appsmith/StyledHeader";

const PageSelector = styled(DropdownComponent)`
  flex: 2;
`;

const NotificationText = styled.div`
  display: flex;
  justify-content: space-evenly;
  align-items: center;
  flex-grow: 1;
`;

const PreviewPublishSection = styled.div`
  display: flex;
  justify-content: space-evenly;
  align-items: center;
  flex-shrink: 1;
`;

const StretchedBreadCrumb = styled(Breadcrumbs)`
  flex-shrink: 1;
  * {
    font-family: ${props => props.theme.fonts[0]};
    font-size: ${props => props.theme.fontSizes[2]}px;
  }
  li:after {
    background: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M10.71 7.29l-4-4a1.003 1.003 0 0 0-1.42 1.42L8.59 8 5.3 11.29c-.19.18-.3.43-.3.71a1.003 1.003 0 0 0 1.71.71l4-4c.18-.18.29-.43.29-.71 0-.28-.11-.53-.29-.71z' fill='rgba(92,112,128,1)'/%3E%3C/svg%3E");
  }
`;

type EditorHeaderProps = {
  notificationText?: string;
  pageName: string;
  onPublish: React.FormEventHandler;
  onCreatePage: (name: string) => void;
  pages?: PageListPayload;
  currentPageId: string;
  switchToPage: (selectedPage: string) => void;
  isPublishing: boolean;
};

export const EditorHeader = (props: EditorHeaderProps) => {
  const navigation: IBreadcrumbProps[] = [
    { href: "#", icon: "folder-close", text: "appsmith-dev" },
    { href: "#", icon: "folder-close", text: "application" },
    { icon: "page-layout", text: "", current: true },
  ];

  const pageList:
    | Array<{
        label: string;
        value: string;
      }>
    | undefined =
    props.pages &&
    props.pages.map((page: { pageName: string; pageId: string }) => ({
      label: page.pageName,
      value: page.pageId,
    }));

  const selectedPage: DropdownOption | undefined =
    pageList && pageList.find(page => page.value === props.currentPageId);

  return (
    <StyledHeader>
      <StretchedBreadCrumb items={navigation} />
      {pageList && (
        <PageSelector
          options={pageList}
          selectHandler={props.switchToPage}
          selected={selectedPage}
          addItem={{
            displayText: "Create Page",
            addItemHandler: props.onCreatePage,
          }}
        />
      )}
      <NotificationText>
        {props.notificationText && <Spinner size={Spinner.SIZE_SMALL} />}
        <span>{props.notificationText}</span>
      </NotificationText>
      <PreviewPublishSection>
        <BaseButton
          onClick={props.onPublish}
          text="Publish"
          loading={props.isPublishing}
          styleName="primary"
          filled
        />
      </PreviewPublishSection>
    </StyledHeader>
  );
};

export default EditorHeader;
