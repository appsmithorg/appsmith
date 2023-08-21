import { adaptiveSignpostingEnabled } from "@appsmith/selectors/featureFlagsSelectors";
import WalkthroughContext from "components/featureWalkthrough/walkthroughContext";
import { Colors } from "constants/Colors";
import { ASSETS_CDN_URL } from "constants/ThirdPartyConstants";
import { FEATURE_WALKTHROUGH_KEYS } from "constants/WalkthroughConstants";
import { Button } from "design-system";
import { useIsWidgetActionConnectionPresent } from "pages/Editor/utils";
import React, { useContext, useEffect } from "react";
import { useSelector } from "react-redux";
import { getEvaluationInverseDependencyMap } from "selectors/dataTreeSelectors";
import { getCurrentPageId } from "selectors/editorSelectors";
import { getCanvasWidgets, getPageActions } from "selectors/entitiesSelector";
import { getIsFirstTimeUserOnboardingEnabled } from "selectors/onboardingSelectors";
import styled from "styled-components";
import {
  getFeatureWalkthroughShown,
  setFeatureWalkthroughShown,
} from "utils/storage";

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
  const pageId = useSelector(getCurrentPageId);
  const actions = useSelector(getPageActions(pageId));
  const widgets = useSelector(getCanvasWidgets);
  const deps = useSelector(getEvaluationInverseDependencyMap);
  const isConnectionPresent = useIsWidgetActionConnectionPresent(
    widgets,
    actions,
    deps,
  );

  useEffect(() => {
    if (!isConnectionPresent) {
      checkAndShowWalkthrough();
    }
  }, [signpostingEnabled]);
  const closeWalkthrough = () => {
    if (popFeature && isWalkthroughOpened) {
      popFeature();
    }
  };
  const checkAndShowWalkthrough = async () => {
    const isFeatureWalkthroughShown = await getFeatureWalkthroughShown(
      FEATURE_WALKTHROUGH_KEYS.connect_data,
    );
    adaptiveSignposting &&
      !isFeatureWalkthroughShown &&
      signpostingEnabled &&
      pushFeature &&
      pushFeature(
        {
          targetId: `#table-overlay-connectdata`,
          details: {
            title: "Connect data",
            description:
              "Swiftly bind data to the widget by connecting your query with just a click of this button.",
            imageURL: `${ASSETS_CDN_URL}/connect-data.gif`,
          },
          onDismiss: async () => {
            await setFeatureWalkthroughShown(
              FEATURE_WALKTHROUGH_KEYS.connect_data,
              true,
            );
          },
          offset: {
            position: "right",
            highlightPad: 5,
            indicatorLeft: -3,
            style: {
              transform: "none",
              boxShadow: "var(--ads-v2-shadow-popovers)",
              border: "1px solid var(--ads-v2-color-border-muted)",
            },
          },
          overlayColor: "transparent",
          delay: 1000,
        },
        true,
      );
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
