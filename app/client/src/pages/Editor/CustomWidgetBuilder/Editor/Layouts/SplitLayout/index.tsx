import React, { useEffect, useRef, useState } from "react";
import styles from "./styles.module.css";
import type { ContentProps } from "../../CodeEditors/types";

interface Props {
  rows: Array<{
    title: string;
    titleControls?: React.ReactNode;
    children: (props: ContentProps) => React.ReactNode;
  }>;
}

export default function SplitLayout(props: Props) {
  const { rows } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = React.useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (containerRef.current) {
      setHeight(
        window.innerHeight - containerRef.current.getBoundingClientRect().top,
      );

      setLoading(false);
    }

    const handler = () => {
      if (containerRef.current) {
        setHeight(
          window.innerHeight - containerRef.current.getBoundingClientRect().top,
        );
      }
    };

    window.addEventListener("resize", handler);

    return () => {
      window.removeEventListener("resize", handler);
    };
  }, []);

  return (
    <div className={styles.wrapper} ref={containerRef}>
      {!loading &&
        rows.map((row) => (
          <div key={row.title}>
            <div className={styles.editorHeader}>
              <div>{row.title}</div>
              {row.titleControls}
            </div>
            {row.children({
              height: height / 3 - 39,
              width: "100%",
            })}
          </div>
        ))}
    </div>
  );
}
