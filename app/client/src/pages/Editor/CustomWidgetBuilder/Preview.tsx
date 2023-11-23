import React, { useContext, useLayoutEffect, useRef } from "react";
import styles from "./styles.module.css";
import CustomComponent from "widgets/CustomWidget/component";
import { CustomWidgetBuilderContext } from ".";
import { toast } from "design-system";

export default function Preview() {
  const { key, model, srcDoc, updateModel } = useContext(
    CustomWidgetBuilderContext,
  );

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
        execute={(name) => {
          toast.show(`Event fired: ${name}`, { kind: "success" });
        }}
        height={dimensions.height}
        key={key}
        model={model || {}}
        srcDoc={srcDoc || { html: "", js: "", css: "" }}
        update={(data) => {
          updateModel?.(data);
          toast.show(`Model updated`, { kind: "success" });
        }}
        width={dimensions.width}
      />
    </div>
  );
}
