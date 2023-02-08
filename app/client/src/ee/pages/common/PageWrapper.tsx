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
import { BannerMessage, IconSize, Text, TextType } from "design-system-old";
import { Colors } from "constants/Colors";
import {
  getRemainingDays,
  isTrialLicense,
  shouldShowLicenseBanner,
  isAdminUser,
} from "@appsmith/selectors/tenantSelectors";
import {
  CONTINUE_USING_FEATURES,
  createMessage,
  TRIAL_EXPIRY_WARNING,
  UPGRADE,
  NON_ADMIN_USER_TRIAL_EXPIRTY_WARNING,
} from "@appsmith/constants/messages";
import { goToCustomerPortal } from "@appsmith/utils/billingUtils";
import capitalize from "lodash/capitalize";
import { selectFeatureFlags } from "selectors/usersSelectors";

const StyledBanner = styled(BannerMessage)`
  position: fixed;
  z-index: 1;
  width: 100%;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  svg {
    position: relative;
    top: 2px;
  }
`;

const StyledText = styled(Text)<{ color: string; underline?: boolean }>`
  text-decoration: ${(props) => (props.underline ? "underline" : "none")};
  text-underline-offset: 4px;
  color: ${(props) => props.color ?? "inherit"};
  letter-spacing: 0.2px;
  line-height: 16px;
  font-size: 14px;
  span {
    font-size: 24px;
  }
  button {
  }
`;

export function PageWrapper(props: PageWrapperProps) {
  const { isFixed = false, isSavable = false } = props;
  const isTrial = useSelector(isTrialLicense);
  const gracePeriod = useSelector(getRemainingDays);
  const showBanner = useSelector(shouldShowLicenseBanner);
  const isHomePage = useRouteMatch("/applications")?.isExact;
  const isAdmin = useSelector(isAdminUser);
  const features = useSelector(selectFeatureFlags);

  const getBannerMessage: any = () => {
    if (isTrial) {
      return {
        backgroundColor:
          gracePeriod > 3
            ? Colors.WARNING_ORANGE
            : Colors.DANGER_NO_SOLID_HOVER,
        className: "t--deprecation-warning banner",
        icon: "warning-line",
        iconColor: gracePeriod > 3 ? Colors.GRAY_800 : Colors.RED_500,
        iconSize: IconSize.XXL,
        message: (
          <>
            <StyledText
              color={gracePeriod > 3 ? Colors.GRAY_800 : Colors.RED_500}
              dangerouslySetInnerHTML={{
                __html: createMessage(() => TRIAL_EXPIRY_WARNING(gracePeriod)),
              }}
              type={TextType.P1}
              weight="600"
            />
            {isAdmin ? (
              <>
                <StyledText
                  as="button"
                  color={gracePeriod > 3 ? Colors.GRAY_800 : Colors.RED_500}
                  onClick={goToCustomerPortal}
                  type={TextType.P1}
                  underline
                  weight="600"
                >
                  {capitalize(createMessage(UPGRADE))}
                </StyledText>{" "}
                <StyledText
                  color={gracePeriod > 3 ? Colors.GRAY_800 : Colors.RED_500}
                  type={TextType.P1}
                  weight="600"
                >
                  {createMessage(CONTINUE_USING_FEATURES)}
                </StyledText>
              </>
            ) : (
              <StyledText
                color={gracePeriod > 3 ? Colors.GRAY_800 : Colors.RED_500}
                type={TextType.P1}
                weight="600"
              >
                {createMessage(NON_ADMIN_USER_TRIAL_EXPIRTY_WARNING)}
              </StyledText>
            )}
          </>
        ),
      };
    }
  };

  return (
    <Wrapper isFixed={isFixed}>
      {features.USAGE_AND_BILLING &&
        showBanner &&
        isHomePage &&
        getBannerMessage && <StyledBanner {...getBannerMessage()} />}
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
