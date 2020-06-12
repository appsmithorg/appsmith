import { Plugin } from "api/PluginApi";
import {
  PLUGIN_PACKAGE_MONGO,
  PLUGIN_PACKAGE_POSTGRES,
} from "constants/QueryEditorConstants";
import ImageAlt from "assets/images/placeholder-image.svg";
import Postgres from "assets/images/Postgress.png";
import MongoDB from "assets/images/MongoDB.png";

export const getPluginImage = (plugins: Plugin[], pluginId: string) => {
  const plugin = plugins.find(plugin => plugin.id === pluginId);

  switch (plugin?.packageName) {
    case PLUGIN_PACKAGE_MONGO:
      return MongoDB;
    case PLUGIN_PACKAGE_POSTGRES:
      return Postgres;
    default:
      return ImageAlt;
  }
};
