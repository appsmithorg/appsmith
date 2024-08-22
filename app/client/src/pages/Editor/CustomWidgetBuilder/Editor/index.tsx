import React, { useContext } from "react";

import { CustomWidgetBuilderContext } from "..";
import HTMLEditor from "./CodeEditors/HTMLEditor";
import JSEditor from "./CodeEditors/JSEditor";
import StyleEditor, { TitleControls } from "./CodeEditors/StyleEditor";
import type { ContentProps } from "./CodeEditors/types";
import Header from "./Header";
import Layout from "./Layouts";
import References from "./References";
import styles from "./styles.module.css";

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
          ]}
        />
        {isReferenceOpen && <References />}
      </div>
    </div>
  );
}
