import React, { useEffect, useRef, useState } from "react";
import styles from "./styles.module.css";
import { Tab, TabPanel, Tabs, TabsList } from "@appsmith/ads";
import type { ContentProps } from "../../CodeEditors/types";
import useLocalStorageState from "utils/hooks/useLocalStorageState";

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

  const [selectedTab, setSelectedTab] = useLocalStorageState<string>(
    LOCAL_STORAGE_KEYS,
    tabs[0].title,
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
              className={styles.tabPanel}
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
