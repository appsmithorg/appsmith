import React, { useContext, useMemo } from "react";

import { CustomWidgetBuilderContext } from "../..";
import type { ContentProps } from "../CodeEditors/types";
import SplitLayout from "./SplitLayout";
import TabLayout from "./TabsLayout";
import styles from "./styles.module.css";

interface Props {
  content: Array<{
    title: string;
    titleControls?: React.ReactNode;
    children: (props: ContentProps) => React.ReactNode;
  }>;
}

export default function Layout(props: Props) {
  const { content } = props;

  const context = useContext(CustomWidgetBuilderContext);

  const layout = useMemo(() => {
    switch (context.selectedLayout) {
      case "tabs":
        return <TabLayout tabs={content} />;
      case "split":
        return <SplitLayout rows={content} />;
      default:
        return <div>Tab Layout</div>;
    }
  }, [context.selectedLayout]);

  return (
    <div
      className={
        context.isReferenceOpen
          ? styles.editorLayoutPartialWidth
          : styles.editorLayoutFullWidth
      }
    >
      {layout}
    </div>
  );
}
