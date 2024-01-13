import React from "react";
import { useSelector } from "react-redux";

import FooterLinks from "./FooterLinks";
import { getTenantConfig } from "@appsmith/selectors/tenantSelectors";
import { getAssetUrl } from "@appsmith/utils/airgapHelpers";

interface ContainerProps {
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  disabledLoginForm?: boolean;
  testId?: string;
}

function Container(props: ContainerProps) {
  const { children, footer, subtitle, testId, title } = props;
  const tenantConfig = useSelector(getTenantConfig);

  return (
    <div
      className="flex flex-col items-center gap-4 my-auto min-w-min"
      data-testid={testId}
    >
      <div className="bg-white border border-t-4 border-[color:var(--ads-v2\-color-border)] border-t-[color:var(--ads-v2\-color-border-brand)] py-8 px-6 w-[min(400px,80%)] flex flex-col gap-6 t--login-container rounded-[var(--ads-v2\-border-radius)]">
        <img
          className="h-8 mx-auto"
          src={getAssetUrl(tenantConfig.brandLogoUrl)}
        />
        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-xl font-semibold text-center text-[color:var(--ads-v2\-color-fg-emphasis)]">
            {title}
          </h1>
          {subtitle && (
            <p className="text-base text-center text-[color:var(--ads-v2\-color-fg)]">
              {subtitle}
            </p>
          )}
        </div>
        {children}
      </div>

      <div className="bg-white border w-[min(400px,80%)] rounded-[var(--ads-v2\-border-radius)]  border-[color:var(--ads-v2\-color-border)]">
        {footer}
        <FooterLinks />
      </div>
    </div>
  );
}

export default Container;
