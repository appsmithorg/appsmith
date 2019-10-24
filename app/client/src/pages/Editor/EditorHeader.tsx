import React from "react";
import styled from "styled-components";
import { Breadcrumbs, IBreadcrumbProps, Spinner } from "@blueprintjs/core";
import { BaseButton } from "../../components/canvas/Button";

const Header = styled.header`
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: ${props => props.theme.headerHeight};
  padding: 0px 30px;
  box-shadow: 0px 0px 3px #ccc;
  background: #fff;
  font-size: ${props => props.theme.fontSizes[1]}px;
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
  flex-grow: 1;
`;

const StretchedBreadCrumb = styled(Breadcrumbs)`
  flex-grow: 10;
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
  onPreview: React.FormEventHandler;
};

export const EditorHeader = (props: EditorHeaderProps) => {
  const navigation: IBreadcrumbProps[] = [
    { href: "#", icon: "folder-close", text: "appsmith-dev" },
    { href: "#", icon: "folder-close", text: "application" },
    { icon: "page-layout", text: props.pageName, current: true },
  ];

  return (
    <Header>
      <StretchedBreadCrumb items={navigation} />
      <NotificationText>
        {props.notificationText && <Spinner size={Spinner.SIZE_SMALL} />}
        <span>{props.notificationText}</span>
      </NotificationText>
      <PreviewPublishSection>
        <BaseButton
          onClick={props.onPreview}
          text="Preview"
          styleName="secondary"
          filled
        />
        <BaseButton
          onClick={props.onPublish}
          text="Publish"
          styleName="primary"
          filled
        />
      </PreviewPublishSection>
    </Header>
  );
};

export default EditorHeader;
