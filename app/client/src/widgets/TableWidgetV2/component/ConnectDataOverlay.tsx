/* eslint-disable @typescript-eslint/no-unused-vars */
import WalkthroughContext from "components/featureWalkthrough/walkthroughContext";
import { Colors } from "constants/Colors";
import { ASSETS_CDN_URL } from "constants/ThirdPartyConstants";
import { Button } from "design-system";
import React, { useContext, useEffect } from "react";
import { useSelector } from "react-redux";
import { getIsFirstTimeUserOnboardingEnabled } from "selectors/onboardingSelectors";
import styled from "styled-components";

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
  const { pushFeature } = useContext(WalkthroughContext) || {};
  const signpostingEnabled = useSelector(getIsFirstTimeUserOnboardingEnabled);

  useEffect(() => {
    if (true) {
      // checkAndShowWalkthrough();
    }
  }, [signpostingEnabled]);

  const checkAndShowWalkthrough = () => {
    pushFeature &&
      pushFeature({
        targetId: `#table-overlay-connectdata`,
        details: {
          title: "Connect data",
          description:
            "Swiftly bind data to the widget by connecting your query with just a click of this button.",
          imageURL: `${ASSETS_CDN_URL}/connect-data.gif`,
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
      });
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
          onClick={props.onConnectData}
          size="md"
        >
          Connect data
        </ConnecData>
      </Container>
    </Wrapper>
  );
}
