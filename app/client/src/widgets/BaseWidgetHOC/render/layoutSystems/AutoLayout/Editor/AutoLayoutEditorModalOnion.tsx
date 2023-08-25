import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import React from "react";
import { WidgetNameLayer } from "widgets/BaseWidgetHOC/render/common/WidgetNameLayer";
import { ClickContentToOpenPropPane } from "utils/hooks/useClickToSelectWidget";
import { ModalResizableLayer } from "../../common/ModalResizableLayer";
import ErrorBoundary from "components/editorComponents/ErrorBoundry";
import { AutoLayoutWidgetComponent } from "../common/AutoLayoutWidgetNameComponent";
import { ModalOverlayLayer } from "../../common/ModalOverlayLayer";

export const AutoLayoutEditorModalOnion = (props: BaseWidgetProps) => {
  return (
    <ErrorBoundary>
      <AutoLayoutWidgetComponent {...props}>
        <ModalOverlayLayer {...props} isEditMode>
          <ModalResizableLayer {...props}>
            <WidgetNameLayer {...props}>
              <ClickContentToOpenPropPane widgetId={props.widgetId}>
                {props.children}
              </ClickContentToOpenPropPane>
            </WidgetNameLayer>
          </ModalResizableLayer>
        </ModalOverlayLayer>
      </AutoLayoutWidgetComponent>
    </ErrorBoundary>
  );
};
