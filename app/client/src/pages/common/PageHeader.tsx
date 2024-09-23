import React, { useEffect } from "react";
import { useRouteMatch } from "react-router-dom";
import { connect, useDispatch, useSelector } from "react-redux";
import { getCurrentUser } from "selectors/usersSelectors";
import styled from "styled-components";
import StyledHeader from "components/designSystems/appsmith/StyledHeader";
import type { AppState } from "ee/reducers";
import type { User } from "constants/userConstants";
import { useIsMobileDevice } from "utils/hooks/useDeviceDetect";
import { getTemplateNotificationSeenAction } from "actions/templateActions";
import { shouldShowLicenseBanner } from "ee/selectors/tenantSelectors";
import { Banner } from "ee/utils/licenseHelpers";
import bootIntercom from "utils/bootIntercom";
import EntitySearchBar from "pages/common/SearchBar/EntitySearchBar";
import { Switch, Tooltip } from "@appsmith/ads";
import { getIsAnvilLayoutEnabled } from "layoutSystems/anvil/integrations/selectors";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { setFeatureFlagOverrideValues } from "utils/storage";
import { updateFeatureFlagOverrideAction } from "actions/featureFlagActions";

const StyledPageHeader = styled(StyledHeader)<{
  hideShadow?: boolean;
  isMobile?: boolean;
  showSeparator?: boolean;
  isBannerVisible?: boolean;
}>`
  justify-content: space-between;
  background: var(--ads-v2-color-bg);
  height: 48px;
  color: var(--ads-v2-color-bg);
  position: fixed;
  top: 0;
  z-index: var(--ads-v2-z-index-9);
  border-bottom: 1px solid var(--ads-v2-color-border);
  ${({ isMobile }) =>
    isMobile &&
    `
    padding: 0 12px;
    padding-left: 10px;
    `};
  ${({ isBannerVisible, isMobile }) =>
    isBannerVisible ? (isMobile ? `top: 70px;` : `top: 40px;`) : ""};

  /* intentionally "hacky" approach to show the Anvil toggle in the header. This will be removed once all features work well with Anvil */
  & .ads-v2-switch {
    display: block;
    width: 100%;
    position: absolute;
    left: 175px;
    top: 12px;
    width: 30px;
    & > label {
      min-width: 0;
      flex-direction: row-reverse;
    }
  }
`;

interface PageHeaderProps {
  user?: User;
  hideShadow?: boolean;
  showSeparator?: boolean;
  hideEditProfileLink?: boolean;
}

export function PageHeader(props: PageHeaderProps) {
  const { user } = props;
  const dispatch = useDispatch();

  const isMobile = useIsMobileDevice();

  useEffect(() => {
    dispatch(getTemplateNotificationSeenAction());
  }, []);

  useEffect(() => {
    bootIntercom(user);
  }, [user?.email]);

  const showBanner = useSelector(shouldShowLicenseBanner);
  const isHomePage = useRouteMatch("/applications")?.isExact;
  const isLicensePage = useRouteMatch("/license")?.isExact;
  const isAnvilEnabled = useSelector(getIsAnvilLayoutEnabled);
  const shouldShowAnvilToggle = useFeatureFlag(
    FEATURE_FLAG.release_anvil_toggle_enabled,
  );

  /*
    If Anvil toggle is enabled, the switch allows us to enable or disable Anvil
    We pass the anvil feature's value via the toggle. We also passthrough the original
    anvil toggle feature flag value as-is.
  */
  function handleAnvilToggle(isSelected: boolean) {
    const featureFlags = {
      release_anvil_enabled: isSelected,
      release_anvil_toggle_enabled: shouldShowAnvilToggle,
    };

    dispatch(updateFeatureFlagOverrideAction(featureFlags));
    setFeatureFlagOverrideValues(featureFlags);
  }

  return (
    <>
      <Banner />
      <StyledPageHeader
        data-testid="t--appsmith-page-header"
        hideShadow={props.hideShadow || false}
        isBannerVisible={showBanner && (isHomePage || isLicensePage)}
        isMobile={isMobile}
        showSeparator={props.showSeparator || false}
      >
        {
          // Based on a feature flag, show the switch that enables/disables Anvil
          shouldShowAnvilToggle && (
            <Switch isSelected={isAnvilEnabled} onChange={handleAnvilToggle}>
              <Tooltip content="Toggles Anvil Layout System" trigger="hover">
                <b>&alpha;</b>
              </Tooltip>
            </Switch>
          )
        }
        <EntitySearchBar user={user} />
      </StyledPageHeader>
    </>
  );
}

const mapStateToProps = (state: AppState) => ({
  user: getCurrentUser(state),
  hideShadow: state.ui.theme.hideHeaderShadow,
  showSeparator: state.ui.theme.showHeaderSeparator,
});

export default connect(mapStateToProps)(PageHeader);
