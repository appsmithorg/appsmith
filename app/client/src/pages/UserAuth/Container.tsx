import React from "react";
import { useSelector } from "react-redux";

import { getOrganizationConfig } from "ee/selectors/organizationSelectors";
import { getAssetUrl } from "ee/utils/airgapHelpers";
import LeftSideContent from "./LeftSideContent";
import { getAppsmithConfigs } from "ee/configs";
import { useIsMobileDevice } from "utils/hooks/useDeviceDetect";
import styled from "styled-components";
import { getIsAiAgentInstanceEnabled } from "ee/selectors/aiAgentSelectors";
import clsx from "clsx";
import { selectFeatureFlags } from "ee/selectors/featureFlagsSelectors";
import { isBrandingEnabled, isMultiOrgFFEnabled } from "ee/utils/planHelpers";

interface ContainerProps {
  title: string | React.ReactNode;
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

const BoxWrapper = styled.div<{ isMobileView: boolean }>`
  box-shadow: 0px 1px 20px 0px rgba(76, 86, 100, 0.11);
  border-radius: var(--ads-v2-border-radius);
  background: var(--ads-v2-color-bg);
  display: flex;
  flex-direction: column;
  gap: var(--ads-v2-spaces-5);
  padding: 32px 24px;

  ${({ isMobileView }) =>
    isMobileView ? "border: 1px solid var(--ads-v2-color-border);" : ""}
`;

function Container(props: ContainerProps) {
  const { children, footer, subtitle, testId, title } = props;
  const organizationConfig = useSelector(getOrganizationConfig);
  const { cloudHosting } = getAppsmithConfigs();
  const isMobileDevice = useIsMobileDevice();
  const featureFlags = useSelector(selectFeatureFlags);
  const multiOrgEnabled = isMultiOrgFFEnabled(featureFlags);
  const brandingEnabled = isBrandingEnabled(featureFlags);

  const shouldShowLeftSideContent =
    cloudHosting && !isMobileDevice && multiOrgEnabled && !brandingEnabled;
  const isAiAgentInstanceEnabled = useSelector(getIsAiAgentInstanceEnabled);

  return (
    <ContainerWrapper
      className={clsx({
        "my-auto flex items-center justify-center min-w-min": true,
        "flex-col-reverse gap-4": isAiAgentInstanceEnabled,
        "flex-row gap-14": !isAiAgentInstanceEnabled,
      })}
      data-testid={testId}
    >
      {shouldShowLeftSideContent && <LeftSideContent />}
      <BoxWrapper
        className={`t--login-container ${
          isMobileDevice ? "w-full" : "w-[min(400px,80%)]"
        }`}
        isMobileView={isMobileDevice}
      >
        {!isMobileDevice && (
          <img
            className="h-8 mx-auto"
            src={getAssetUrl(organizationConfig.brandLogoUrl)}
          />
        )}
        <div className={`flex flex-col gap-4`}>
          <div className="flex flex-col gap-2 text-center">
            <h1 className="text-lg font-semibold text-center text-[color:var(--ads-v2\-color-fg-emphasis)]">
              {title}
            </h1>
            {subtitle && (
              <p className="text-[14px] text-center text-[color:var(--ads-v2\-color-fg)] whitespace-pre-line">
                {subtitle}
              </p>
            )}
          </div>
          {children}
          {footer}
        </div>
      </BoxWrapper>
    </ContainerWrapper>
  );
}

export default Container;
