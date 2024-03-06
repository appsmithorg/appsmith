package com.appsmith.server.modules.helpers;

import com.appsmith.server.dtos.ModuleDTO;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;

import java.security.SecureRandom;
import java.util.Iterator;
import java.util.Map;
import java.util.stream.Collectors;

public class ModuleUtils {
    public static final String MODULE_ENTITY_NAME_SEPARATOR_PREFIX = "_$";
    public static final String MODULE_ENTITY_NAME_SEPARATOR_SUFFIX = "$_";

    private static final String ALPHABET = "abcdefghijklmnopqrstuvwxyz";
    private static final int STRING_LENGTH = 10;

    public static String generateUniqueIdForInputField() {
        StringBuilder uniqueId = new StringBuilder(STRING_LENGTH);
        SecureRandom random = new SecureRandom();

        for (int i = 0; i < STRING_LENGTH; i++) {
            int index = random.nextInt(ALPHABET.length());
            char randomChar = ALPHABET.charAt(index);
            uniqueId.append(randomChar);
        }

        return uniqueId.toString();
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

    public static String getValidName(String rootName, String currentFQN) {
        return MODULE_ENTITY_NAME_SEPARATOR_PREFIX + rootName + MODULE_ENTITY_NAME_SEPARATOR_SUFFIX + currentFQN;
    }

    public static Map<String, String> transformModuleInputsToModuleInstance(ModuleDTO moduleDTO) {
        if (moduleDTO.getInputsForm() == null || moduleDTO.getInputsForm().isEmpty()) {
            return Map.of();
        }
        return moduleDTO.getInputsForm().get(0).getChildren().stream()
                .collect(Collectors.toMap(
                        moduleInput -> moduleInput.getLabel(), // `label` is supposed to be unique
                        moduleInput -> moduleInput.getDefaultValue()));
    }
}
