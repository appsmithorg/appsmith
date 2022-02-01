import React, { useEffect } from "react";
import { TabComponent } from "components/ads/Tabs";
import ApplicationLoader from "pages/Applications/loader";
import Templates from "pages/Templates";
import PageWrapper from "pages/common/PageWrapper";
import { LeftPane } from "pages/Applications";
import styled from "styled-components";
import { Indices } from "constants/Layers";
import { useDispatch } from "react-redux";
import { setHeaderMeta } from "actions/themeActions";

const TabsWrapper = styled.div`
  position: fixed;
  top: 2px;
  left: ${(props) => props.theme.homePage.sidebar}px;
  z-index: ${Indices.Layer9};
  margin-top: 8px;

  .react-tabs__tab-list {
    border-bottom: 1px solid #ededed;
    padding-left: 32px;
  }
  .tab-title-wrapper {
    padding-bottom: 17px;
  }
`;

function HomeScreenTabs() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setHeaderMeta(true, true));
  }, []);

  return (
    <PageWrapper>
      <LeftPane />
      <TabsWrapper>
        <TabComponent
          tabs={[
            {
              key: "applications",
              title: "Applications",
              panelComponent: <ApplicationLoader />,
            },
            {
              key: "templates",
              title: "Templates",
              panelComponent: <div>Templates</div>,
            },
          ]}
        />
      </TabsWrapper>
    </PageWrapper>
  );
}

export default HomeScreenTabs;
