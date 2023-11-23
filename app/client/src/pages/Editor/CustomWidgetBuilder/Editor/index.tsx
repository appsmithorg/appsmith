import React, { useContext } from "react";
import styles from "./styles.module.css";
import Layout from "./Layouts";
import Header from "./Header";
import { CustomWidgetBuilderContext } from "..";
import HTMLEditor from "./CodeEditors/HTMLEditor";
import CSSEditor from "./CodeEditors/CSSEditor";
import JSEditor from "./CodeEditors/JSEditor";
import type { ContentProps } from "./CodeEditors/types";
import References from "./References";

export default function Editor() {
  const { isReferenceOpen } = useContext(CustomWidgetBuilderContext);

  return (
    <div className={styles.contentRight}>
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
              title: "CSS",
              children: (props: ContentProps) => <CSSEditor {...props} />,
            },
            {
              title: "Javascript",
              children: (props: ContentProps) => <JSEditor {...props} />,
            },
          ]}
        />
        {isReferenceOpen && <References />}
      </div>
    </div>
  );
}
