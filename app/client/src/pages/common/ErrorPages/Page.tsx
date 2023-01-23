import React from "react";
import { useSelector } from "react-redux";
import { getTenantConfig } from "@appsmith/selectors/tenantSelectors";
import { getComplementaryGrayscaleColor } from "widgets/WidgetUtils";
import styled from "styled-components";

const ErrorIconContainer = styled.div`
  & {
    align-items: end;

    svg {
      transform: scale(2.5) rotate(180deg);
    }
  }
`;

type PageProps = {
  children?: React.ReactNode;
  errorCode?: string | number;
  errorIcon?: React.ReactNode;
  title?: string;
  description: string;
  cta?: React.ReactNode;
  flushErrorsAndRedirect?: any;
};

function Page(props: PageProps) {
  const { cta, description, errorCode, errorIcon, title } = props;
  const tenantConfig = useSelector(getTenantConfig);
  const backgroundColor = tenantConfig.brandColors.background;
  const textColor = getComplementaryGrayscaleColor(backgroundColor);

  return (
    <div
      className={`absolute inset-0 flex flex-col items-center justify-center space-y-6 bg-[color:var(--ads-color-background-secondary)] ${
        textColor === "white" ? "text-white" : ""
      }`}
    >
      {errorIcon && (
        <ErrorIconContainer className="mb-2 flex items-center font-bold text-3xl justify-center w-28 aspect-square text-[color:var(--ads-color-brand)]">
          {errorIcon}
        </ErrorIconContainer>
      )}
      {errorCode && (
        <div className="-mt-8 flex items-center font-bold text-3xl justify-center w-28 bg-white border aspect-square text-[color:var(--ads-color-brand)]">
          {errorCode}
        </div>
      )}
      {title && (
        <p className="text-3xl font-semibold t--error-page-title">{title}</p>
      )}
      {description && <p className="text-center">{description}</p>}
      {cta}
    </div>
  );
}

export default Page;
