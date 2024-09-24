import React, { useCallback, useEffect, useRef } from "react";
import Header from "./header";
import styles from "./styles.module.css";
import Preview from "./Preview";
import { Spinner } from "@appsmith/ads";
import Editor from "./Editor";
import type { CustomWidgetBuilderContextType } from "./types";
import ConnectionLost from "./connectionLost";
import Helmet from "react-helmet";
import { useCustomBuilder } from "./useCustomBuilder";
import { tailwindLayers } from "constants/Layers";
import useHorizontalResize from "utils/hooks/useHorizontalResize";
import styled from "styled-components";
import classNames from "classnames";
import useLocalStorageState from "utils/hooks/useLocalStorageState";

export const CustomWidgetBuilderContext = React.createContext<
  Partial<CustomWidgetBuilderContextType>
>({});

const ResizerHandler = styled.div<{ resizing: boolean }>`
  width: 6px;
  height: 100%;
  margin-left: 2px;
  border-right: 1px solid var(--ads-v2-color-border);
  background: ${(props) =>
    props.resizing ? "var(--ads-v2-color-border)" : "transparent"};
  &:hover {
    background: var(--ads-v2-color-border);
    border-color: transparent;
  }
`;

const Overlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
`;

const EDITOR_WIDTH_KEY = "CUSTOM_WIDGET_BUILDER_EDITOR_WIDTH";

export default function CustomWidgetBuilder() {
  const [context, loading] = useCustomBuilder();

  const [editorWidth, setEditorWidth] = useLocalStorageState(
    EDITOR_WIDTH_KEY,
    window.innerWidth * 0.5,
  );

  const editorRef = useRef<HTMLDivElement>(null);

  const previewRef = useRef<HTMLDivElement>(null);

  const onResize = useCallback((newWidth) => {
    if (editorRef.current && previewRef.current) {
      const widthPercentage = (newWidth / window.innerWidth) * 100;

      editorRef.current.style.width = `${widthPercentage}%`;
      previewRef.current.style.width = `${100 - widthPercentage}%`;

      setEditorWidth(newWidth);
    }
  }, []);

  useEffect(() => {
    onResize(editorWidth);
  }, [editorRef.current, previewRef.current]);

  const { onMouseDown, onMouseUp, onTouchStart, resizing } =
    useHorizontalResize(editorRef, onResize, undefined, true);

  return (
    <CustomWidgetBuilderContext.Provider value={context}>
      <Helmet>
        <meta charSet="utf-8" />
        <title>{`${context.name} | Builder | Appsmith`}</title>
      </Helmet>
      <Header />
      {loading ? (
        <Spinner className={styles.loader} size="lg" />
      ) : (
        <div className={styles.content}>
          <div className={styles.contentLeft} ref={previewRef}>
            {resizing && <Overlay />}
            <Preview width={editorWidth} />
          </div>
          <div
            className={`w-2 h-full -ml-2 group  cursor-ew-resize ${tailwindLayers.resizer}`}
            onMouseDown={onMouseDown}
            onTouchEnd={onMouseUp}
            onTouchStart={onTouchStart}
          >
            <ResizerHandler
              className={classNames({
                "transform transition": true,
              })}
              resizing={resizing}
            />
          </div>
          <div className={styles.contentRight} ref={editorRef}>
            <Editor />
          </div>
        </div>
      )}
      <ConnectionLost />
    </CustomWidgetBuilderContext.Provider>
  );
}

export { Header as CustomWidgetBuilderHeader };
