import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import React from "react";
import { forceLicenseCheck } from "@appsmith/actions/tenantActions";

import {
  getRemainingDays,
  isTrialLicense,
  isAdminUser,
  isLicenseValidating,
  isLicensePaymentFailed,
} from "@appsmith/selectors/tenantSelectors";
import {
  CONTINUE_USING_FEATURES,
  createMessage,
  TRIAL_EXPIRY_WARNING,
  UPGRADE,
  NON_ADMIN_USER_TRIAL_EXPIRTY_WARNING,
  ALREADY_UPGRADED,
  REFRESH,
  UPDATE,
  PAYMENT_FAILED_UPDATE,
  PAYMENT_FAILED,
} from "@appsmith/constants/messages";
import { Callout, Link, Text } from "design-system";
import { isAirgapped } from "@appsmith/utils/airgapHelpers";
import { getAppsmithConfigs } from "@appsmith/configs";

const appsmithConfigs = getAppsmithConfigs();

const StyledText = styled(Text)<{ color: string }>`
  color: ${(props) => props.color ?? "var(--ads-v2-color-fg)"};
  white-space: nowrap;
`;

const FlexWrapper = styled.span<{ color?: string; justify?: string }>`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: ${(props) => props.justify ?? "space-between"};
  .upgrade-link {
    margin: 0 4px 0 4px;
    text-decoration: underline !important;
    color: ${(props) => props.color} !important;
  }
  .main-text {
    margin-left: 8px;
  }
  p {
    color: ${(props) => props.color ?? "var(--ads-v2-color-fg)"};
  }
`;

const ContentWrapper = styled.span`
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-right: 2px;
`;

const FlexContentWrapper = styled.span`
  display: flex;
  align-items: center;
  gap: 2px;
`;

const StyledBanner = styled(Callout)`
  position: fixed;
  z-index: 1;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;

  > div:nth-child(2) {
    display: flex;
    align-items: center;
    gap: 12px;

    > div {
      margin: 0;
    }
  }
`;

const enum Suffix {
  DAYS = "days",
  DAY = "day",
  HOURS = "hours",
  HOUR = "hour",
}

export function PageBannerMessage(): any {
  const isAdmin = useSelector(isAdminUser);
  const dispatch = useDispatch();
  const isTrial = useSelector(isTrialLicense);
  const isPaymentFailed = useSelector(isLicensePaymentFailed);
  const { days: gracePeriod, suffix } = useSelector(getRemainingDays);
  const isCheckingLicense = useSelector(isLicenseValidating);
  const lessThanThreeDays =
    (gracePeriod <= 3 && (suffix === Suffix.DAYS || suffix === Suffix.DAY)) ||
    suffix === Suffix.HOURS ||
    suffix === Suffix.HOUR;
  const isAirgappedInstance = isAirgapped();

  const color = lessThanThreeDays
    ? "var(--ads-v2-color-fg-error)"
    : "var(--ads-v2-color-fg)";

  if ((isPaymentFailed && isAdmin) || isTrial) {
    return (
      <StyledBanner
        className="trial-warning-banner"
        kind={lessThanThreeDays ? "error" : "warning"}
        {...(isAdmin && !isAirgappedInstance
          ? {
              links: [
                {
                  children: createMessage(REFRESH),
                  onClick: () =>
                    !isCheckingLicense && dispatch(forceLicenseCheck()),
                  startIcon: "refresh",
                  className: "refresh-link",
                },
              ],
            }
          : {})}
      >
        <FlexWrapper
          className="wrapper-banner"
          color={color}
          justify={isAdmin && !isAirgappedInstance ? "space-between" : "center"}
        >
          {isAdmin && <span> </span>}
          <FlexContentWrapper>
            <p
              className="main-text"
              dangerouslySetInnerHTML={{
                __html: isTrial
                  ? createMessage(() =>
                      TRIAL_EXPIRY_WARNING(gracePeriod, suffix),
                    )
                  : createMessage(PAYMENT_FAILED),
              }}
              data-testid="t--trial-expiry-warning"
            />
            {isAdmin && !isAirgappedInstance ? (
              <ContentWrapper className="wrapper-content">
                <Link
                  className="upgrade-link"
                  data-testid="t--trial-expiry-upgrade-btn"
                  to={`${appsmithConfigs.customerPortalUrl}/plans`}
                >
                  {createMessage(isTrial ? UPGRADE : UPDATE)}
                </Link>
                <p
                  dangerouslySetInnerHTML={{
                    __html: isTrial
                      ? createMessage(CONTINUE_USING_FEATURES)
                      : createMessage(() =>
                          PAYMENT_FAILED_UPDATE(gracePeriod, suffix),
                        ),
                  }}
                  data-testid="t--trial-expiry-continue-using-features"
                />
              </ContentWrapper>
            ) : (
              !isAirgappedInstance && (
                <StyledText
                  color={
                    gracePeriod > 3
                      ? "var(--ads-v2-color-fg)"
                      : "var(--ads-v2-color-fg-error)"
                  }
                  data-testid="t--non-admin-trial-expiry-warning"
                  renderAs="p"
                >
                  {createMessage(NON_ADMIN_USER_TRIAL_EXPIRTY_WARNING)}
                </StyledText>
              )
            )}
            <StyledText
              color={color}
              data-testid="t--already-upgraded"
              renderAs="p"
            >
              {createMessage(ALREADY_UPGRADED)}
            </StyledText>
          </FlexContentWrapper>
        </FlexWrapper>
      </StyledBanner>
    );
  }
  return null;
}

export default PageBannerMessage;
