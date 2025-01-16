import React from "react";
import { Button } from "@appsmith/ads";
import type { ControlProps } from "./BaseControl";
import BaseControl from "./BaseControl";

export type HTMLDocumentBuidlerControlProps = ControlProps & {
  propertyList: string;
  generateProperty: (property: string) => ControlProps;
  srcDoc: {
    html: string;
    css: string;
    js: string;
  };
};

class HTMLDocumentBuilderControl extends BaseControl<
  HTMLDocumentBuidlerControlProps,
  {
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    widgetBuilder: any;
  }
> {
  state = {
    widgetBuilder: null,
  };

  onConfigure = () => {
    const widgetBuilder = window.open(
      window.origin + "/widgets/builder",
      "_blank",
    );

    this.setState({ widgetBuilder });

    const props = this.props;

    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    widgetBuilder?.addEventListener("message", (event: any) => {
      if (event.data.type === "BUILDER_READY") {
        widgetBuilder.postMessage({
          type: "BUILDER_READY_ACK",
          srcDoc: props.widgetProperties.srcDoc,
          model:
            props.widgetProperties.__evaluation__.evaluatedValues.defaultModel,
        });
      } else if (event.data.type === "BUILDER_UPDATE") {
        props.onPropertyChange?.(props.propertyName, event.data.srcDoc);
      }
    });
  };

  render() {
    return (
      <Button
        kind="secondary"
        onClick={() => this.onConfigure()}
        size="sm"
      >
        configure
      </Button>
    );
  }

  static getControlType() {
    return "HTML_DOCUMENT_BUILDER";
  }
}

export default HTMLDocumentBuilderControl;
