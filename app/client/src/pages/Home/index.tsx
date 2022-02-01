import React, { useEffect, useState } from "react";
import { TabComponent } from "components/ads/Tabs";
import ApplicationLoader from "pages/Applications/loader";
import PageWrapper from "pages/common/PageWrapper";
import { LeftPane as ApplicationsLeftPane } from "pages/Applications";
import styled from "styled-components";
import { Indices } from "constants/Layers";
import { useDispatch } from "react-redux";
import { setHeaderMeta } from "actions/themeActions";
import { APPLICATIONS_URL, TEMPLATES_URL } from "constants/routes";
import history from "utils/history";

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

const HomePageTabsKeys = {
  APPLICATIONS: "applications",
  TEMPLATES: "templates",
};

const HomeTabs = [
  {
    key: HomePageTabsKeys.APPLICATIONS,
    title: "Applications",
    panelComponent: <ApplicationLoader />,
    path: APPLICATIONS_URL,
    leftPane: <ApplicationsLeftPane />,
  },
  {
    key: HomePageTabsKeys.TEMPLATES,
    title: "Templates",
    panelComponent: <div>Templates</div>,
    path: TEMPLATES_URL,
    leftPane: <div>test</div>,
  },
];

function HomeScreenTabs() {
  const dispatch = useDispatch();
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (window.location.pathname === TEMPLATES_URL) {
      setSelectedIndex(1);
    }
  }, [window.location.pathname]);

  useEffect(() => {
    dispatch(setHeaderMeta(true, true));
    history.push(HomeTabs[selectedIndex].path);
  }, [selectedIndex]);

  return (
    <PageWrapper>
      {HomeTabs[selectedIndex].leftPane}
      <TabsWrapper>
        <TabComponent
          onSelect={setSelectedIndex}
          selectedIndex={selectedIndex}
          tabs={HomeTabs}
        />
      </TabsWrapper>
    </PageWrapper>
  );
}

export default HomeScreenTabs;
