package com.appsmith.server.modules.helpers;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.CreatorContextType;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import org.springframework.util.StringUtils;

import java.util.Iterator;

import static java.lang.Boolean.FALSE;
import static java.lang.Boolean.TRUE;

public class ModuleUtils {
    public static final String MODULE_ENTITY_NAME_SEPARATOR_PREFIX = "_$";
    public static final String MODULE_ENTITY_NAME_SEPARATOR_SUFFIX = "$_";

    public static boolean isModuleContext(ActionDTO action) {
        return action.getContextType() == CreatorContextType.MODULE;
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

    public static Boolean isModuleAction(ActionDTO actionDTO) {

        if (actionDTO == null) {
            return FALSE;
        } else if (!StringUtils.hasLength(actionDTO.getModuleId())
                || !CreatorContextType.MODULE.equals(actionDTO.getContextType())) {
            return FALSE;
        }

        return TRUE;
    }

    public static String getValidName(String rootName, String currentFQN) {
        return MODULE_ENTITY_NAME_SEPARATOR_PREFIX + rootName + MODULE_ENTITY_NAME_SEPARATOR_SUFFIX + currentFQN;
    }
}
