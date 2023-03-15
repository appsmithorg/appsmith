export * from "ce/pages/common/PageWrapper";
import {
  Wrapper,
  PageBody,
  PageWrapperProps,
} from "ce/pages/common/PageWrapper";
import React from "react";
import { Helmet } from "react-helmet";
import { useSelector } from "react-redux";
import { useRouteMatch } from "react-router";
import styled from "styled-components";
import { BannerMessage } from "design-system-old";
import { shouldShowLicenseBanner } from "@appsmith/selectors/tenantSelectors";

import PageBannerMessage from "./PageWrapperBanner";

const StyledBanner = styled(BannerMessage)`
  position: fixed;
  z-index: 1;
  width: 100%;
  height: 48px;
  display: flex;
  align-items: center;
  & div {
    width: 100%;
  }
`;

export function PageWrapper(props: PageWrapperProps) {
  const { isFixed = false, isSavable = false } = props;
  const showBanner = useSelector(shouldShowLicenseBanner);
  const isHomePage = useRouteMatch("/applications")?.isExact;

  return (
    <Wrapper isFixed={isFixed}>
      {showBanner && isHomePage && PageBannerMessage && (
        <StyledBanner
          {...PageBannerMessage()}
          className="trial-warning-banner"
        />
      )}
      <Helmet>
        <title>{`${
          props.displayName ? `${props.displayName} | ` : ""
        }Appsmith`}</title>
      </Helmet>
      <PageBody isSavable={isSavable}>{props.children}</PageBody>
    </Wrapper>
  );
}

export default PageWrapper;
