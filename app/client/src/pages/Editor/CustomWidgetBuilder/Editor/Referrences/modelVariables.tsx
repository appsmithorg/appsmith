import React, { useContext } from "react";
import ReactJson from "react-json-view";
import { CustomWidgetBuilderContext } from "../..";
import { Switch, Text, Tooltip } from "design-system";
import styles from "./styles.module.css";

export default function ModelVariables() {
  const reactJsonProps = {
    theme: "rjv-default",
    name: null,
    enableClipboard: false,
    displayObjectSize: false,
    displayDataTypes: false,
    style: {
      fontSize: "12px",
    },
    collapsed: 2,
    shouldCollapse: (field: any) => {
      const index = field.name * 1;
      return index >= 2;
    },
    indentWidth: 2,
  };

  const { model, toggleUseTransientModel, transientModel, useTransientModel } =
    useContext(CustomWidgetBuilderContext);

  return (
    <div>
      <div className={styles.switchTransientMode}>
        <Switch
          isSelected={useTransientModel}
          onChange={() => toggleUseTransientModel?.()}
        >
          <Tooltip content="Transient model has the model updates made from the custom component in the widget builder. THESE CHANGES WILL NOT BE SAVED IN THE APP">
            <Text>use transient model</Text>
          </Tooltip>
        </Switch>
      </div>
      <ReactJson
        src={useTransientModel ? transientModel : model}
        {...reactJsonProps}
      />
    </div>
  );
}
