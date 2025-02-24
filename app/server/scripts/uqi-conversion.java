package com.example.service;

import com.example.domain.Plugin;
import com.example.repository.PluginRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class UQIGeneratorService {
    private final PluginRepository pluginRepository;
    private final ObjectMapper objectMapper;

    private static final Map<String, String> FIELDS_TYPE_TO_CONTROL_TYPE = Map.of(
        "string", "QUERY_DYNAMIC_INPUT_TEXT",
        "enum", "DROP_DOWN",
        "date", "QUERY_DYNAMIC_INPUT_TEXT",
        "object", "QUERY_DYNAMIC_INPUT_TEXT",
        "boolean", "SWITCH",
        "integer", "QUERY_DYNAMIC_INPUT_TEXT"
    );

    public Mono<Plugin> generateAndSaveUQIConfiguration(String pluginId, JsonNode actionsApiResponse) {
        return Mono.fromCallable(() -> generateUQIConfiguration(actionsApiResponse))
            .flatMap(uqiConfig -> updatePluginWithUQIConfig(pluginId, uqiConfig));
    }

    private Mono<Plugin> updatePluginWithUQIConfig(String pluginId, ObjectNode uqiConfig) {
        return pluginRepository.findById(pluginId)
            .flatMap(plugin -> {
                Map<String, Object> actionUiConfig = new HashMap<>();
                actionUiConfig.put("editor", objectMapper.convertValue(uqiConfig.get("editor"), List.class));
                plugin.setActionUiConfig(actionUiConfig);
                return pluginRepository.save(plugin);
            });
    }

    private ObjectNode generateUQIConfiguration(JsonNode actionsApiResponse) {
        ObjectNode uqiConfiguration = objectMapper.createObjectNode();
        var editorArray = objectMapper.createArrayNode();

        // Process each integration type (zendesk, salesforce, jira, etc.)
        actionsApiResponse.fields().forEachRemaining(entry -> {
            String integrationType = entry.getKey();
            JsonNode integrationNode = entry.getValue();

            if (integrationNode.isArray()) {
                processIntegration(integrationType, integrationNode, editorArray);
            }
        });

        uqiConfiguration.set("editor", editorArray);
        return uqiConfiguration;
    }

    private void processIntegration(String integrationType, JsonNode integrationNode,
                                    com.fasterxml.jackson.databind.node.ArrayNode editorArray) {
        // Create command dropdown configuration
        ObjectNode commandConfig = createCommandConfig();
        List<ObjectNode> sections = new ArrayList<>();

        int idx = 0;
        for (JsonNode functionObj : integrationNode) {
            if ("function".equals(functionObj.get("type").asText())) {
                JsonNode func = functionObj.get("function");
                idx++;

                // Add to command options
                addCommandOption(commandConfig, func, idx);

                // Create section for this function
                ObjectNode section = createSectionConfig(func);
                sections.add(section);
            }
        }

        // Add command config and sections to editor array
        editorArray.add(commandConfig);
        sections.forEach(editorArray::add);
    }

    private ObjectNode createCommandConfig() {
        ObjectNode commandConfig = objectMapper.createObjectNode();
        commandConfig.put("label", "Commands");
        commandConfig.put("description", "Select the method to run");
        commandConfig.put("configProperty", "actionConfiguration.formData.command");
        commandConfig.put("controlType", "DROP_DOWN");
        commandConfig.put("isSearchable", true);
        commandConfig.set("options", objectMapper.createArrayNode());
        return commandConfig;
    }

    private void addCommandOption(ObjectNode commandConfig, JsonNode func, int idx) {
        ObjectNode option = objectMapper.createObjectNode();
        option.put("index", idx);
        option.put("label", toHumanReadableOptionLabel(func.get("name").asText()));
        option.put("value", func.get("name").asText());
        ((com.fasterxml.jackson.databind.node.ArrayNode) commandConfig.get("options")).add(option);
    }

    private ObjectNode createSectionConfig(JsonNode func) {
        ObjectNode section = objectMapper.createObjectNode();
        section.put("identifier", func.get("name").asText());
        section.put("controlType", "SECTION");
        section.put("name", toHumanReadableOptionLabel(func.get("name").asText()));

        ObjectNode conditionals = objectMapper.createObjectNode();
        conditionals.put("show", String.format("{{actionConfiguration.formData.command === '%s'}}",
            func.get("name").asText()));
        section.set("conditionals", conditionals);

        var childrenArray = objectMapper.createArrayNode();
        JsonNode parameters = func.get("parameters");
        JsonNode properties = parameters.get("properties");
        Set<String> requiredFields = getRequiredFields(parameters);

        properties.fields().forEachRemaining(entry -> {
            String key = entry.getKey();
            JsonNode propertyObj = entry.getValue();
            ObjectNode child = createChildConfig(key, propertyObj, func.get("name").asText(), requiredFields);
            childrenArray.add(child);
        });

        section.set("children", childrenArray);
        return section;
    }

    private Set<String> getRequiredFields(JsonNode parameters) {
        Set<String> requiredFields = new HashSet<>();
        if (parameters.has("required")) {
            parameters.get("required").forEach(field -> requiredFields.add(field.asText()));
        }
        return requiredFields;
    }

    private ObjectNode createChildConfig(String key, JsonNode propertyObj, String funcName,
                                         Set<String> requiredFields) {
        ObjectNode child = objectMapper.createObjectNode();
        String controlType = FIELDS_TYPE_TO_CONTROL_TYPE.getOrDefault(
            propertyObj.get("type").asText(), "UNKNOWN");

        child.put("controlType", controlType);
        child.put("identifier", key);
        child.put("configProperty", String.format("actionConfiguration.formData.%s.%s", funcName, key));
        child.put("isRequired", requiredFields.contains(key));
        child.put("label", toHumanReadableLabel(key));
        child.put("tooltipText", propertyObj.has("description") ?
            propertyObj.get("description").asText() : "");
        child.put("placeholderText", "Enter " + toHumanReadableLabel(key));

        handleSpecialTypes(child, propertyObj);
        return child;
    }

    private void handleSpecialTypes(ObjectNode child, JsonNode propertyObj) {
        if (propertyObj.has("enum")) {
            addOptionsToChild(child, propertyObj.get("enum"));
            child.put("isAllowClear", true);
            child.put("controlType", "DROP_DOWN");
        }

        if ("array".equals(propertyObj.get("type").asText())) {
            child.put("isMultiSelect", true);
            if (propertyObj.has("items")) {
                JsonNode items = propertyObj.get("items");
                if (items.has("enum")) {
                    addOptionsToChild(child, items.get("enum"));
                    child.put("isAllowClear", true);
                    child.put("controlType", "DROP_DOWN");
                } else {
                    child.put("controlType", FIELDS_TYPE_TO_CONTROL_TYPE.getOrDefault(
                        items.get("type").asText(), "QUERY_DYNAMIC_INPUT_TEXT"));
                }
            }
        }
    }

    private void addOptionsToChild(ObjectNode child, JsonNode enumNode) {
        var optionsArray = objectMapper.createArrayNode();
        enumNode.forEach(opt -> {
            ObjectNode option = objectMapper.createObjectNode();
            option.put("label", opt.asText());
            option.put("value", opt.asText());
            optionsArray.add(option);
        });
        child.set("options", optionsArray);
    }

    private String toHumanReadableOptionLabel(String option) {
        String[] words = option.split("_");
        return String.join(" ", Arrays.stream(words)
            .skip(1)
            .map(word -> word.substring(0, 1).toUpperCase() + word.substring(1).toLowerCase())
            .toArray(String[]::new));
    }

    private String toHumanReadableLabel(String key) {
        String[] words = key.split("(?=\\p{Upper})|_");
        return String.join(" ", Arrays.stream(words)
            .map(word -> word.substring(0, 1).toUpperCase() + word.substring(1).toLowerCase())
            .toArray(String[]::new));
    }
}
