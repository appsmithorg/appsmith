import { PluginPackageName } from "entities/Action";
import WidgetQueryGeneratorRegistry from "utils/WidgetQueryGeneratorRegistry";
import MongoDB from "./MongoDB";

WidgetQueryGeneratorRegistry.register(PluginPackageName.MONGO, MongoDB);
