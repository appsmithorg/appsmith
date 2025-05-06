import React from "react";
import BaseControl, {
  type ControlProps,
} from "components/formControls/BaseControl";
import type { ControlType } from "constants/PropertyControlConstants";

interface AIChatIntegrationsControlProps extends ControlProps {}

class AIChatIntegrationsControl extends BaseControl<AIChatIntegrationsControlProps> {
  getControlType(): ControlType {
    return "AI_CHAT_INTEGRATIONS_FORM";
  }
  public render() {
    return <div>AIChatIntegrationsControl</div>;
  }
}

export default AIChatIntegrationsControl;
