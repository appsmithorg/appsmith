package com.appsmith.server.helpers;

import com.appsmith.external.models.ActionDTO;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;

import java.util.Iterator;

public class ModuleUtils {
    public static boolean isModuleContext(ActionDTO action) {
        return action.getContext() == ActionDTO.ActionContext.MODULE;
    }

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
}
