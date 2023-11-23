import React from "react";
import { Button } from "design-system";
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
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
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
