import React, { useCallback } from "react";
import omit from "lodash/omit";
import history from "utils/history";
import { Button, type ButtonProps } from "@appsmith/ads";
import type { ControlType } from "constants/PropertyControlConstants";

import BaseControl from "./BaseControl";
import type { ControlProps } from "./BaseControl";
import { useParentEntityInfo } from "ee/IDE/hooks/useParentEntityInfo";
import { getIDETypeByUrl } from "ee/entities/IDE/utils";
import { datasourcesEditorIdURL } from "ee/RouteBuilder";
import { getQueryParams } from "utils/URLUtils";

export interface DatasourceLinkControlProps extends ControlProps {
  href: string;
  text: string;
  size?: ButtonProps["size"];
  kind?: ButtonProps["kind"];
  icon?: ButtonProps["startIcon"];
}

class DatasourceLinkControl extends BaseControl<DatasourceLinkControlProps> {
  getControlType(): ControlType {
    return "DATASOURCE_LINK";
  }
  render() {
    return <DatasourceLink {...this.props} />;
  }
}

function DatasourceLink(props: DatasourceLinkControlProps) {
  const { icon, kind = "secondary", size = "sm", text } = props;
  const ideType = getIDETypeByUrl(location.pathname);
  const { parentEntityId } = useParentEntityInfo(ideType);

  const onPress = useCallback(() => {
    const url = datasourcesEditorIdURL({
      baseParentEntityId: parentEntityId,
      datasourceId: props.datasourceId as string,
      params: { ...omit(getQueryParams(), "viewMode"), viewMode: false },
    });

    history.push(url);
  }, [parentEntityId, props.datasourceId]);

  return (
    <Button
      UNSAFE_width="110px"
      kind={kind}
      onClick={onPress}
      size={size}
      startIcon={icon}
    >
      {text}
    </Button>
  );
}

export interface CheckboxControlProps extends ControlProps {
  info?: string;
}

export { DatasourceLinkControl };
