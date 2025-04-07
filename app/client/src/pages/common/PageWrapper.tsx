import type { ReactNode } from "react";
import React, { useMemo } from "react";
import { Helmet } from "react-helmet";
import styled from "styled-components";
import {
  getPageTitle,
  getHTMLPageTitle,
} from "ee/utils/BusinessFeatures/brandingPageHelpers";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { getOrganizationConfig } from "ee/selectors/organizationSelectors";
import { useSelector } from "react-redux";

export const Wrapper = styled.section<{ isFixed?: boolean }>`
  ${(props) =>
    props.isFixed
      ? `margin: 0;
  position: fixed;
  top: ${props.theme.homePage.header}px;
  width: 100%;`
      : `margin-top: ${props.theme.homePage.header}px;`}
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

export const PageBody = styled.div<{ isSavable?: boolean }>`
  height: calc(100vh - ${(props) => props.theme.homePage.header}px);
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  // padding-top: ${(props) => props.theme.spaces[12]}px;
  margin: 0 auto;
  & > * {
    width: 100%;
  }
`;

export interface PageWrapperProps {
  children?: ReactNode;
  displayName?: string;
  isFixed?: boolean;
  isSavable?: boolean;
}

export function PageWrapper(props: PageWrapperProps) {
  const { isFixed = false, isSavable = false } = props;
  const isBrandingEnabled = useFeatureFlag(
    FEATURE_FLAG?.license_branding_enabled,
  );
  const organizationConfig = useSelector(getOrganizationConfig);
  const { instanceName } = organizationConfig;

  const titleSuffix = useMemo(
    () => getHTMLPageTitle(isBrandingEnabled, instanceName),
    [isBrandingEnabled, instanceName],
  );

  const pageTitle = useMemo(
    () => getPageTitle(isBrandingEnabled, props.displayName, titleSuffix),
    [isBrandingEnabled, props.displayName, titleSuffix],
  );

  return (
    <Wrapper isFixed={isFixed}>
      <Helmet>
        <title>{pageTitle}</title>
      </Helmet>
      <PageBody isSavable={isSavable}>{props.children}</PageBody>
    </Wrapper>
  );
}

export default PageWrapper;
