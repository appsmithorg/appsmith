import React, { useContext } from "react";
import styles from "./styles.module.css";
import { CustomWidgetBuilderContext } from "../..";
import TabLayout from "./TabsLayout";
import type { ContentProps } from "../CodeEditors/types";

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

  return (
    <div
      className={
        context.isReferenceOpen
          ? styles.editorLayoutPartialWidth
          : styles.editorLayoutFullWidth
      }
    >
      <TabLayout tabs={content} />
    </div>
  );
}
