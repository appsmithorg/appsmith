import type { PluginType } from "../../../entities/Plugin";
import type { ReactNode } from "react";

export interface EntityItem {
  title: string;
  type: PluginType;
  key: string;
  icon?: ReactNode;
  group?: string;
  userPermissions?: string[];
}

export interface GenericEntityItem extends Omit<EntityItem, "type"> {}
