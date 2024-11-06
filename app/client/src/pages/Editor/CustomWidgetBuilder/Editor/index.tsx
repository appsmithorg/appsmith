import React, { useContext } from "react";
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

export default function Editor() {
  const { isReferenceOpen } = useContext(CustomWidgetBuilderContext);

  return (
    <div>
      <div className={styles.headerControls}>
        <Header />
      </div>
      <div className={styles.contentRightBody}>
        <Layout
          content={[
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
            {
              title: "AI",
              children: (props: ContentProps) => <ChatBot {...props} />,
            },
          ]}
        />
        {isReferenceOpen && <References />}
      </div>
    </div>
  );
}
