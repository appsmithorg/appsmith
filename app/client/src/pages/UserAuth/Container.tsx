import React from "react";
import { useSelector } from "react-redux";

import { getTenantConfig } from "@appsmith/selectors/tenantSelectors";
import { getAssetUrl } from "@appsmith/utils/airgapHelpers";
import LeftSideContent from "./LeftSideContent";
import { getAppsmithConfigs } from "@appsmith/configs";
import { useIsMobileDevice } from "utils/hooks/useDeviceDetect";
import styled from "styled-components";

interface ContainerProps {
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  disabledLoginForm?: boolean;
  testId?: string;
}

const ContainerWrapper = styled.div`
  a {
    span {
      font-weight: 500;
    }
  }
`;

function MainContent(props: ContainerProps) {
  const { children, footer, subtitle, title } = props;
  const tenantConfig = useSelector(getTenantConfig);
  return (
    <>
      <img
        className="h-8 mx-auto"
        src={getAssetUrl(tenantConfig.brandLogoUrl)}
      />
      <div className={`flex flex-col gap-4`}>
        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-lg font-semibold text-center text-[color:var(--ads-v2\-color-fg-emphasis)]">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[14px] text-center text-[color:var(--ads-v2\-color-fg)]">
              {subtitle}
            </p>
          )}
        </div>
        {children}
        {footer}
      </div>
    </>
  );
}

function Container(props: ContainerProps) {
  const { testId } = props;
  const { cloudHosting } = getAppsmithConfigs();
  const isMobileDevice = useIsMobileDevice();

  return isMobileDevice ? (
    <MainContent {...props} />
  ) : (
    <ContainerWrapper
      className={`gap-14 my-auto flex items-center justify-center min-w-min`}
      data-testid={testId}
    >
      {cloudHosting && <LeftSideContent />}
      <div
        className={`bg-white border border-[color:var(--ads-v2-color-border)] px-6 py-8 w-[min(400px,80%)] gap-4 flex flex-col t--login-container rounded-[var(--ads-v2\-border-radius)]`}
      >
        <MainContent {...props} />
      </div>
    </ContainerWrapper>
  );
}

export default Container;
