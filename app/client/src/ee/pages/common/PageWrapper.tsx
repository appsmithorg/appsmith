export * from "ce/pages/common/PageWrapper";
import {
  Wrapper,
  PageBody,
  PageWrapperProps,
} from "ce/pages/common/PageWrapper";
import React from "react";
import { Helmet } from "react-helmet";
import { useDispatch, useSelector } from "react-redux";
import { useRouteMatch } from "react-router";
import styled from "styled-components";
import {
  BannerMessage,
  Button,
  Category,
  Icon,
  IconSize,
  Text,
  TextType,
} from "design-system-old";
import { Colors } from "constants/Colors";
import {
  getRemainingDays,
  isTrialLicense,
  shouldShowLicenseBanner,
  isAdminUser,
  isLicenseValidating,
} from "@appsmith/selectors/tenantSelectors";
import {
  CONTINUE_USING_FEATURES,
  createMessage,
  TRIAL_EXPIRY_WARNING,
  UPGRADE,
  NON_ADMIN_USER_TRIAL_EXPIRTY_WARNING,
  ALREADY_UPGRADED,
  REFRESH,
} from "@appsmith/constants/messages";
import { goToCustomerPortal } from "@appsmith/utils/billingUtils";
import capitalize from "lodash/capitalize";
import { selectFeatureFlags } from "selectors/usersSelectors";
import { forceLicenseCheck } from "@appsmith/actions/tenantActions";

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

export function PageWrapper(props: PageWrapperProps) {
  const { isFixed = false, isSavable = false } = props;
  const isTrial = useSelector(isTrialLicense);
  const { days: gracePeriod, suffix } = useSelector(getRemainingDays);
  const showBanner = useSelector(shouldShowLicenseBanner);
  const isCheckingLicense = useSelector(isLicenseValidating);
  const isHomePage = useRouteMatch("/applications")?.isExact;
  const isAdmin = useSelector(isAdminUser);
  const features = useSelector(selectFeatureFlags);
  const dispatch = useDispatch();
  const getBannerMessage: any = () => {
    const lessThanThreeDays =
      (gracePeriod <= 3 && (suffix === Suffix.DAYS || suffix === Suffix.DAY)) ||
      suffix === Suffix.HOURS ||
      suffix === Suffix.HOUR;

    const color = lessThanThreeDays ? Colors.RED_500 : Colors.GRAY_800;
    if (isTrial) {
      return {
        backgroundColor: lessThanThreeDays
          ? Colors.DANGER_NO_SOLID_HOVER
          : Colors.WARNING_ORANGE,
        className: "t--deprecation-warning banner",
        message: (
          <FlexWrapper
            className="wrapper-banner"
            justify={isAdmin ? "space-between" : "center"}
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
                  __html: createMessage(() =>
                    TRIAL_EXPIRY_WARNING(gracePeriod, suffix),
                  ),
                }}
                type={TextType.P1}
                weight="600"
              />
              {isAdmin ? (
                <ContentWrapper className="wrapper-content">
                  <StyledText
                    as="button"
                    className="upgrade-btn"
                    color={color}
                    onClick={goToCustomerPortal}
                    type={TextType.P1}
                    underline
                    weight="600"
                  >
                    {capitalize(createMessage(UPGRADE))}
                  </StyledText>{" "}
                  <StyledText color={color} type={TextType.P1} weight="600">
                    {createMessage(CONTINUE_USING_FEATURES)}
                  </StyledText>
                </ContentWrapper>
              ) : (
                <StyledText
                  color={gracePeriod > 3 ? Colors.GRAY_800 : Colors.RED_500}
                  type={TextType.P1}
                  weight="600"
                >
                  {createMessage(NON_ADMIN_USER_TRIAL_EXPIRTY_WARNING)}
                </StyledText>
              )}
            </FlexContentWrapper>
            {isAdmin && (
              <ActionBtnWrapper className="wrapper-cta">
                <StyledText
                  color={Colors.SCORPION}
                  type={TextType.P1}
                  weight="600"
                >
                  {createMessage(ALREADY_UPGRADED)}
                </StyledText>
                <RefreshButton
                  category={Category.secondary}
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
  };

  return (
    <Wrapper isFixed={isFixed}>
      {features.USAGE_AND_BILLING &&
        showBanner &&
        isHomePage &&
        getBannerMessage && (
          <StyledBanner {...getBannerMessage()} className="wrapper-container" />
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
