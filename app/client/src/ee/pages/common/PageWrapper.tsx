export * from "ce/pages/common/PageWrapper";
import type { PageWrapperProps } from "ce/pages/common/PageWrapper";
import { Wrapper, PageBody } from "ce/pages/common/PageWrapper";
import React from "react";
import { Helmet } from "react-helmet";
import { useSelector } from "react-redux";
import { useRouteMatch } from "react-router";
import { shouldShowLicenseBanner } from "@appsmith/selectors/tenantSelectors";

import PageBannerMessage from "./PageWrapperBanner";

export function PageWrapper(props: PageWrapperProps) {
  const { isFixed = false, isSavable = false } = props;
  const showBanner = useSelector(shouldShowLicenseBanner);
  const isHomePage = useRouteMatch("/applications")?.isExact;

  return (
    <Wrapper isFixed={isFixed}>
      {showBanner && isHomePage && <PageBannerMessage />}
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
