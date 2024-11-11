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

export default function Editor() {
  const { isReferenceOpen } = useContext(CustomWidgetBuilderContext);
  const isAIEnabled = useFeatureFlag(
    FEATURE_FLAG.release_custom_widget_ai_builder,
  );

  const tabs = useMemo(() => {
    const defaultTabs = [
      {
        title: "HTML",
        children: (props: ContentProps) => <HTMLEditor {...props} />,
      },
      {
        title: "Style",
        titleControls: <TitleControls />,
        children: (props: ContentProps) => <StyleEditor {...props} />,
      },
      {
        title: "Javascript",
        children: (props: ContentProps) => <JSEditor {...props} />,
      },
    ];

    if (isAIEnabled) {
      defaultTabs.push({
        title: "AI",
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
