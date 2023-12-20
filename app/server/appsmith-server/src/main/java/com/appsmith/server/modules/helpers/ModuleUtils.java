package com.appsmith.server.modules.helpers;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;

import java.util.Iterator;

public class ModuleUtils {
    public static final String MODULE_ENTITY_NAME_SEPARATOR_PREFIX = "_$";
    public static final String MODULE_ENTITY_NAME_SEPARATOR_SUFFIX = "$_";

    public static void getSettingsForModuleCreator(JsonNode pluginSettingsNode, JsonNode moduleInstanceSettingsNode) {
        Iterator<JsonNode> pluginSettingsIterator = pluginSettingsNode.iterator();
        while (pluginSettingsIterator.hasNext()) {
            JsonNode pluginSetting = pluginSettingsIterator.next();
            Iterator<JsonNode> pluginChildrenIterator =
                    pluginSetting.get("children").iterator();

            while (pluginChildrenIterator.hasNext()) {
                JsonNode pluginChild = pluginChildrenIterator.next();

                if (hasMatchingLabel(pluginChild, moduleInstanceSettingsNode)) {
                    pluginChildrenIterator.remove();
                }
            }
        }
    }

    private static boolean hasMatchingLabel(JsonNode pluginChild, JsonNode moduleInstanceSettingsNode) {
        ArrayNode moduleInstanceSettingsChildren =
                (ArrayNode) moduleInstanceSettingsNode.get(0).get("children");

        for (JsonNode moduleInstanceSettingsChild : moduleInstanceSettingsChildren) {
            if (pluginChild.get("label").equals(moduleInstanceSettingsChild.get("label"))) {
                return true;
            }
        }
        return false;
    }

    public static String getValidName(String rootName, String currentFQN) {
        return MODULE_ENTITY_NAME_SEPARATOR_PREFIX + rootName + MODULE_ENTITY_NAME_SEPARATOR_SUFFIX + currentFQN;
    }
}
