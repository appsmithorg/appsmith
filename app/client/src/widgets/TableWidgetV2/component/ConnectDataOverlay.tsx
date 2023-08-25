import { adaptiveSignpostingEnabled } from "@appsmith/selectors/featureFlagsSelectors";
import WalkthroughContext from "components/featureWalkthrough/walkthroughContext";
import { Colors } from "constants/Colors";

import { FEATURE_WALKTHROUGH_KEYS } from "constants/WalkthroughConstants";
import { Button } from "design-system";
import { SignpostingWalkthroughConfig } from "pages/Editor/FirstTimeUserOnboarding/Utils";
import React, { useContext, useEffect } from "react";
import { useSelector } from "react-redux";
import { actionsExistInCurrentPage } from "selectors/entitiesSelector";
import {
  getIsFirstTimeUserOnboardingEnabled,
  isWidgetActionConnectionPresent,
} from "selectors/onboardingSelectors";
import styled from "styled-components";
import { getFeatureWalkthroughShown } from "utils/storage";

const Wrapper = styled.div`
  position: absolute;
  z-index: 9;
  top: 0px;
  left: 0pc;
  height: 100%;
  width: 100%;
  background: #ffffff61;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Container = styled.div`
  max-width: 440px;
  text-align: center;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
`;

const Header = styled.div`
  font-weight: 600;
  font-size: 16px;
  line-height: 24px;
  color: ${Colors.GREY_900};
  margin-bottom: 12px;
`;

const ConnecData = styled(Button)`
  margin-bottom: 16px;
`;

export function ConnectDataOverlay(props: { onConnectData: () => void }) {
  const {
    isOpened: isWalkthroughOpened,
    popFeature,
    pushFeature,
  } = useContext(WalkthroughContext) || {};
  const signpostingEnabled = useSelector(getIsFirstTimeUserOnboardingEnabled);
  const adaptiveSignposting = useSelector(adaptiveSignpostingEnabled);
  const actionsExist = useSelector(actionsExistInCurrentPage);
  const isConnectionPresent = useSelector(isWidgetActionConnectionPresent);

  useEffect(() => {
    if (
      signpostingEnabled &&
      adaptiveSignposting &&
      !isConnectionPresent &&
      actionsExist
    ) {
      checkAndShowWalkthrough();
    }
  }, [
    signpostingEnabled,
    adaptiveSignposting,
    isConnectionPresent,
    actionsExist,
  ]);
  const closeWalkthrough = () => {
    if (popFeature && isWalkthroughOpened) {
      popFeature();
    }
  };
  const checkAndShowWalkthrough = async () => {
    const isFeatureWalkthroughShown = await getFeatureWalkthroughShown(
      FEATURE_WALKTHROUGH_KEYS.connect_data,
    );
    !isFeatureWalkthroughShown &&
      pushFeature &&
      pushFeature(SignpostingWalkthroughConfig.CONNECT_DATA, true);
  };

  const onClick = () => {
    props.onConnectData();

    closeWalkthrough();
  };

  return (
    <Wrapper>
      <Container>
        <Header className="t--cypress-table-overlay-header">
          Connect your data or use sample data to display table
        </Header>
        <ConnecData
          className="t--cypress-table-overlay-connectdata"
          id={"table-overlay-connectdata"}
          onClick={onClick}
          size="md"
        >
          Connect data
        </ConnecData>
      </Container>
    </Wrapper>
  );
}
