import React, { useContext, useLayoutEffect, useRef } from "react";
import styles from "./styles.module.css";
import CustomComponent from "widgets/CustomWidget/component";
import { noop } from "lodash";
import { CustomWidgetBuilderContext } from ".";

export default function Preview() {
  const { model, srcDoc } = useContext(CustomWidgetBuilderContext);

  const [dimensions, setDimensions] = React.useState({
    width: 300,
    height: 500,
  });

  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (containerRef.current) {
      setDimensions({
        width: containerRef.current?.clientWidth,
        height:
          window.innerHeight - containerRef.current.getBoundingClientRect().top,
      });
    }
  }, [containerRef.current]);

  return (
    <div className={styles.contentLeft} ref={containerRef}>
      <CustomComponent
        execute={noop}
        height={dimensions.height}
        model={model || {}}
        srcDoc={srcDoc || { html: "", js: "", css: "" }}
        update={noop}
        width={dimensions.width}
      />
    </div>
  );
}
