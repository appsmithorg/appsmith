import React, { useContext, useEffect, useRef, useState } from "react";
import styles from "./styles.module.css";
import CustomComponent from "widgets/CustomWidget/component";
import { CustomWidgetBuilderContext } from "../index";
import { toast } from "design-system";
import Debugger from "./Debugger";

export default function Preview() {
  const [logs, setLogs] = useState<{ type: string; args: any }[]>([]);

  const { key, model, srcDoc, updateModel } = useContext(
    CustomWidgetBuilderContext,
  );

  const [dimensions, setDimensions] = useState({
    width: 300,
    height: 500,
  });

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      setDimensions({
        width: containerRef.current?.clientWidth,
        height:
          window.innerHeight -
          containerRef.current.getBoundingClientRect().top -
          28,
      });
    }
  }, [containerRef.current]);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current?.clientWidth,
          height:
            window.innerHeight -
            containerRef.current.getBoundingClientRect().top -
            30,
        });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className={styles.contentLeft} ref={containerRef}>
      <CustomComponent
        execute={(name) => {
          toast.show(`Event fired: ${name}`, { kind: "success" });
        }}
        height={dimensions.height}
        key={key}
        model={model || {}}
        onConsole={(type, args) => {
          setLogs((prev) => [
            ...prev,
            {
              type,
              args,
            },
          ]);
        }}
        srcDoc={srcDoc || { html: "", js: "", css: "" }}
        update={(data) => {
          updateModel?.(data);
          toast.show(`Model updated`, { kind: "success" });
        }}
        width={dimensions.width}
      />
      <Debugger clear={() => setLogs([])} logs={logs} />
    </div>
  );
}
