import React, { ReactNode } from "react";
import { Helmet } from "react-helmet";
import styled from "styled-components";
import PageHeader from "./PageHeader";

const Wrapper = styled.section`
  && .fade {
    position: relative;
  }
  && .fade-enter {
    opacity: 0;
    z-index: 1;
  }

  && .fade-enter.fade-enter-active {
    opacity: 1;
    transition: opacity 150ms ease-in;
  }
  .fade-exit {
    opacity: 1;
  }
  .fade-exit-active {
    display: none;
    opacity: 0;
  }
`;

const PageBody = styled.div`
  width: ${props => props.theme.pageContentWidth}px;
  min-height: calc(
    100vh - ${props => props.theme.headerHeight + props.theme.spaces[12]}
  );
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  margin: ${props => props.theme.spaces[12]}px auto;
  background: ${props => props.theme.colors.bodyBG};
  & > * {
    width: 100%;
  }
`;

type PageWrapperProps = {
  children?: ReactNode;
  displayName?: string;
};

export const PageWrapper = (props: PageWrapperProps) => (
  <Wrapper>
    <Helmet>
      <title>{`${props.displayName} | Appsmith`}</title>
    </Helmet>
    <PageHeader />
    <PageBody>{props.children}</PageBody>
  </Wrapper>
);

export default PageWrapper;
