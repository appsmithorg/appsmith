import React, { useEffect, useRef } from "react";
import styles from "./styles.module.css";
import type { ContentProps } from "../../CodeEditors/types";

interface Props {
  rows: Array<{
    title: string;
    children: (props: ContentProps) => React.ReactNode;
  }>;
}

export default function SplitLayout(props: Props) {
  const { rows } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = React.useState(0);

  useEffect(() => {
    if (containerRef.current) {
      setHeight(
        window.innerHeight - containerRef.current.getBoundingClientRect().top,
      );
    }
  }, []);

  return (
    <div className={styles.wrapper} ref={containerRef}>
      {rows.map((row) => (
        <div key={row.title}>
          {row.children({
            height: height / 3,
            width: "100%",
          })}
        </div>
      ))}
    </div>
  );
}
