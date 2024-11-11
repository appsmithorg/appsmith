import React, { useContext, useMemo } from "react";
import styles from "./styles.module.css";
import Layout from "./Layouts";
import Header from "./Header";
import { CustomWidgetBuilderContext } from "..";
import HTMLEditor from "./CodeEditors/HTMLEditor";
import StyleEditor, { TitleControls } from "./CodeEditors/StyleEditor";
import JSEditor from "./CodeEditors/JSEditor";
import type { ContentProps } from "./CodeEditors/types";
import References from "./References";
import { ChatBot } from "./ChatBot/ChatBot";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { CUSTOM_WIDGET_BUILDER_TABS } from "../constants";

export default function Editor() {
  const { isReferenceOpen } = useContext(CustomWidgetBuilderContext);
  const isAIEnabled = useFeatureFlag(
    FEATURE_FLAG.release_custom_widget_ai_builder,
  );

  const tabs = useMemo(() => {
    const defaultTabs = [
      {
        title: CUSTOM_WIDGET_BUILDER_TABS.HTML,
        children: (props: ContentProps) => <HTMLEditor {...props} />,
      },
      {
        title: CUSTOM_WIDGET_BUILDER_TABS.STYLE,
        titleControls: <TitleControls />,
        children: (props: ContentProps) => <StyleEditor {...props} />,
      },
      {
        title: CUSTOM_WIDGET_BUILDER_TABS.JS,
        children: (props: ContentProps) => <JSEditor {...props} />,
      },
    ];

    if (isAIEnabled) {
      defaultTabs.push({
        title: CUSTOM_WIDGET_BUILDER_TABS.AI,
        children: (props: ContentProps) => <ChatBot {...props} />,
      });
    }

    return defaultTabs;
  }, [isAIEnabled]);

  return (
    <div>
      <div className={styles.headerControls}>
        <Header />
      </div>
      <div className={styles.contentRightBody}>
        <Layout content={tabs} />
        {isReferenceOpen && <References />}
      </div>
    </div>
  );
}
