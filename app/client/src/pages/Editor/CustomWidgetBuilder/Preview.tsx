import React, { useContext } from "react";
import styles from "./styles.module.css";
import CustomComponent from "widgets/CustomWidget/component";
import { noop } from "lodash";
import { CustomWidgetBuilderContext } from ".";

export default function Preview() {
  const { model, srcDoc } = useContext(CustomWidgetBuilderContext);

  return (
    <div className={styles.contentLeft}>
      <CustomComponent
        execute={noop}
        height={300}
        model={model || {}}
        srcDoc={srcDoc || { html: "", js: "", css: "" }}
        update={noop}
        width={500}
      />
    </div>
  );
}
