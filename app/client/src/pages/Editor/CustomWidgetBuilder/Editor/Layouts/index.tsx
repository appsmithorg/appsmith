import React, { useContext, useMemo } from "react";
import styles from "./styles.module.css";
import { CustomWidgetBuilderContext } from "../..";
import TabLayout from "./TabsLayout";
import SplitLayout from "./SplitLayout";
import type { ContentProps } from "../CodeEditors/types";

interface Props {
  content: Array<{
    title: string;
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
