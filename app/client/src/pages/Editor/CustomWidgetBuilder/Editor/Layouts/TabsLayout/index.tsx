import React, { useEffect, useRef, useState } from "react";
import styles from "./styles.module.css";
import { Tab, TabPanel, Tabs, TabsList } from "@appsmith/ads";
import type { ContentProps } from "../../CodeEditors/types";
import useLocalStorageState from "utils/hooks/useLocalStorageState";
import classNames from "classnames";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { CUSTOM_WIDGET_BUILDER_TABS } from "../../../constants";

interface Props {
  tabs: Array<{
    title: string;
    titleControls?: React.ReactNode;
    children: (props: ContentProps) => React.ReactNode;
  }>;
}

const LOCAL_STORAGE_KEYS = "custom-widget-layout-tabs-state";

export default function TabLayout(props: Props) {
  const { tabs } = props;

  const isDefaultAITab = useFeatureFlag(
    FEATURE_FLAG.release_custom_widget_ai_builder,
  );

  const [selectedTab, setSelectedTab] = useLocalStorageState<string>(
    LOCAL_STORAGE_KEYS,
    isDefaultAITab
      ? CUSTOM_WIDGET_BUILDER_TABS.AI
      : CUSTOM_WIDGET_BUILDER_TABS.JS,
  );

  useEffect(() => {
    if (!tabs.find((d) => d.title === selectedTab)) {
      setSelectedTab(tabs[0].title);
    }
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);

  const [height, setHeight] = React.useState(0);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (containerRef.current) {
      setHeight(
        window.innerHeight -
          containerRef.current.getBoundingClientRect().top -
          39,
      );

      setLoading(false);
    }

    const handler = () => {
      if (containerRef.current) {
        setHeight(
          window.innerHeight -
            containerRef.current.getBoundingClientRect().top -
            39,
        );
      }
    };

    window.addEventListener("resize", handler);

    return () => {
      window.removeEventListener("resize", handler);
    };
  }, []);

  const selectedTabObject = tabs.find((d) => d.title === selectedTab);

  return (
    <div className={styles.wrapper} ref={containerRef}>
      {!loading && (
        <Tabs
          onValueChange={(tab: string) => {
            /*
             * We need this set timeout to let the editor blur event fire before changin the tab
             *  to let the editor save the last cursor position
             */
            setTimeout(() => {
              setSelectedTab(tab);
            });
          }}
          value={selectedTab}
        >
          <TabsList className={styles.tabList}>
            {tabs.map((tab) => (
              <Tab key={tab.title} value={tab.title}>
                {tab.title}
              </Tab>
            ))}
          </TabsList>
          {tabs.map((tab) => (
            <TabPanel
              className={classNames(styles.tabPanel, {
                "data-[state=inactive]:hidden": selectedTab !== tab.title,
              })}
              forceMount
              key={tab.title}
              value={tab.title}
            >
              {tab.children({
                height: height,
                width: "100%",
              })}
            </TabPanel>
          ))}
        </Tabs>
      )}
      <div className={styles.controls}>
        {selectedTabObject && <div>{selectedTabObject.titleControls}</div>}
      </div>
    </div>
  );
}
