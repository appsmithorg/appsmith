import styled from "styled-components";
import { Colors } from "constants/Colors";
import { useDispatch, useSelector } from "react-redux";
import React from "react";

import { goToCustomerPortal } from "@appsmith/utils/billingUtils";
import capitalize from "lodash/capitalize";
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
import {
  Button,
  Category,
  Icon,
  IconSize,
  Text,
  TextType,
} from "design-system-old";
import { isAirgapped } from "@appsmith/utils/airgapHelpers";

const StyledText = styled(Text)<{ color: string; underline?: boolean }>`
  text-decoration: ${(props) => (props.underline ? "underline" : "none")};
  text-underline-offset: 4px;
  color: ${(props) => props.color ?? "inherit"};
  letter-spacing: 0.2px;
  line-height: 16px;
  font-size: 13px;
  white-space: nowrap;
`;

const FlexWrapper = styled.span<{ justify?: string }>`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: ${(props) => props.justify ?? "space-between"};
  margin: 0px 60px;
  .upgrade-btn {
    margin: 0 4px 0 4px;
  }
  .main-text {
    margin-left: 8px;
  }
`;

const ActionBtnWrapper = styled.span`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 4px;
`;

const ContentWrapper = styled.span`
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-right: 2px;
`;

const RefreshButton = styled(Button)`
  background: transparent;
  border: 1px solid ${Colors.SCORPION};
  &:hover {
    background: transparent;
    border: 1px solid ${Colors.SCORPION};
  }
`;

const FlexContentWrapper = styled.span`
  display: flex;
  align-items: center;
  gap: 2px;
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

  const color = lessThanThreeDays ? Colors.RED_500 : Colors.GRAY_800;
  if ((isPaymentFailed && isAdmin) || isTrial) {
    return {
      backgroundColor: lessThanThreeDays
        ? Colors.DANGER_NO_SOLID_HOVER
        : Colors.WARNING_ORANGE,
      className: "t--deprecation-warning banner",
      message: (
        <FlexWrapper
          className="wrapper-banner"
          justify={isAdmin && !isAirgappedInstance ? "space-between" : "center"}
        >
          {isAdmin && <span> </span>}
          <FlexContentWrapper>
            <Icon
              clickable={false}
              fillColor={color}
              name="warning-line"
              size={IconSize.XL}
            />
            <StyledText
              className="main-text"
              color={color}
              dangerouslySetInnerHTML={{
                __html: isTrial
                  ? createMessage(() =>
                      TRIAL_EXPIRY_WARNING(gracePeriod, suffix),
                    )
                  : createMessage(PAYMENT_FAILED),
              }}
              data-testid="t--trial-expiry-warning"
              type={TextType.P1}
              weight="600"
            />
            {isAdmin && !isAirgappedInstance ? (
              <ContentWrapper className="wrapper-content">
                <StyledText
                  as="button"
                  className="upgrade-btn"
                  color={color}
                  data-testid="t--trial-expiry-upgrade-btn"
                  onClick={goToCustomerPortal}
                  type={TextType.P1}
                  underline
                  weight="600"
                >
                  {capitalize(createMessage(isTrial ? UPGRADE : UPDATE))}
                </StyledText>{" "}
                <StyledText
                  color={color}
                  dangerouslySetInnerHTML={{
                    __html: isTrial
                      ? createMessage(CONTINUE_USING_FEATURES)
                      : createMessage(() =>
                          PAYMENT_FAILED_UPDATE(gracePeriod, suffix),
                        ),
                  }}
                  data-testid="t--trial-expiry-continue-using-features"
                  type={TextType.P1}
                  weight="600"
                />
              </ContentWrapper>
            ) : (
              !isAirgappedInstance && (
                <StyledText
                  color={gracePeriod > 3 ? Colors.GRAY_800 : Colors.RED_500}
                  data-testid="t--non-admin-trial-expiry-warning"
                  type={TextType.P1}
                  weight="600"
                >
                  {createMessage(NON_ADMIN_USER_TRIAL_EXPIRTY_WARNING)}
                </StyledText>
              )
            )}
          </FlexContentWrapper>
          {isAdmin && !isAirgappedInstance && (
            <ActionBtnWrapper className="wrapper-cta">
              <StyledText
                color={Colors.SCORPION}
                data-testid="t--already-upgraded"
                type={TextType.P1}
                weight="600"
              >
                {createMessage(ALREADY_UPGRADED)}
              </StyledText>
              <RefreshButton
                category={Category.secondary}
                data-testid="t--license-refresh-btn"
                isLoading={isCheckingLicense}
                onClick={() => dispatch(forceLicenseCheck())}
                text={createMessage(REFRESH)}
                type={TextType.P1}
                weight="600"
              />
            </ActionBtnWrapper>
          )}
        </FlexWrapper>
      ),
    };
  }
}

export default PageBannerMessage;
