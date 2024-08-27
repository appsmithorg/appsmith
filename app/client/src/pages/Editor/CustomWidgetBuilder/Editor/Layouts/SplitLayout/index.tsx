import React, { useEffect, useMemo, useRef, useState } from "react";
import styles from "./styles.module.css";
import type { ContentProps } from "../../CodeEditors/types";
import { Icon } from "@appsmith/ads";
import { set } from "lodash";
import classNames from "classnames";
import { useLocalStorage } from "utils/hooks/localstorage";

interface Row {
  title: string;
  titleControls?: React.ReactNode;
  children: (props: ContentProps) => React.ReactNode;
}

interface Props {
  rows: Array<Row>;
}

const HEADER_HEIGHT = 38;

const CUSTOM_WIDGET_SPLIT_VIEW_VISIBILITY =
  "CUSTOM_WIDGET_SPLIT_VIEW_VISIBILITY";

export default function SplitLayout(props: Props) {
  const { rows } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = React.useState(0);
  const [loading, setLoading] = useState(true);
  const [isRowCollapsed, setIsRowCollapsed] = useLocalStorage(
    CUSTOM_WIDGET_SPLIT_VIEW_VISIBILITY,
    Array(rows.length).fill(false),
  );

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

  const computedHeight = useMemo(() => {
    const expandedRows = isRowCollapsed.filter((row: boolean) => !row).length;

    return (height - HEADER_HEIGHT * rows.length) / expandedRows;
  }, [isRowCollapsed, height]);

  return (
    <div className={styles.wrapper} ref={containerRef}>
      {!loading &&
        rows.map((row, index) => (
          <div className={classNames(styles.editor)} key={row.title}>
            <div
              className={classNames(
                styles.editorHeader,
                isRowCollapsed[index] && index === rows.length - 1
                  ? styles.hasBorder
                  : "",
              )}
              onClick={() =>
                setIsRowCollapsed(
                  set([...isRowCollapsed], index, !isRowCollapsed[index]),
                )
              }
            >
              <div>{row.title}</div>
              <div className={styles.editorHeaderControls}>
                {row.titleControls}
                <Icon
                  name={
                    !isRowCollapsed[index]
                      ? "arrow-down-s-line"
                      : "arrow-up-s-line"
                  }
                  size="lg"
                  style={{ cursor: "pointer" }}
                />
              </div>
            </div>

            {!isRowCollapsed[index] && (
              <div
                className={styles.editorBody}
                style={{ height: computedHeight }}
              >
                {row.children({
                  height: computedHeight,
                  width: "100%",
                })}
              </div>
            )}
          </div>
        ))}
    </div>
  );
}
