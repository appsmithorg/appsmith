package com.external.plugins.commands;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.BearerTokenAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.external.plugins.models.ChatMessage;
import com.external.plugins.models.ChatRequestDTO;
import com.external.plugins.models.OpenAIRequestDTO;
import com.external.plugins.utils.RequestUtils;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpMethod;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;
import org.springframework.web.reactive.function.BodyInserters;
import reactor.core.publisher.Mono;

import java.io.IOException;
import java.net.URI;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

import static com.external.plugins.constants.OpenAIConstants.CHAT;
import static com.external.plugins.constants.OpenAIConstants.CHAT_MODEL_SELECTOR;
import static com.external.plugins.constants.OpenAIConstants.DATA;
import static com.external.plugins.constants.OpenAIConstants.ID;
import static com.external.plugins.constants.OpenAIConstants.MESSAGES;
import static com.external.plugins.constants.OpenAIConstants.MODEL;
import static com.external.plugins.constants.OpenAIConstants.TEMPERATURE;
import static com.external.plugins.constants.OpenAIErrorMessages.BAD_TEMPERATURE_CONFIGURATION;
import static com.external.plugins.constants.OpenAIErrorMessages.EXECUTION_FAILURE;
import static com.external.plugins.constants.OpenAIErrorMessages.INCORRECT_MESSAGE_FORMAT;
import static com.external.plugins.constants.OpenAIErrorMessages.INCORRECT_ROLE_VALUE;
import static com.external.plugins.constants.OpenAIErrorMessages.MODEL_NOT_SELECTED;
import static com.external.plugins.constants.OpenAIErrorMessages.QUERY_NOT_CONFIGURED;
import static com.external.plugins.constants.OpenAIErrorMessages.STRING_APPENDER;

public class ChatCommand implements OpenAICommand {

    private final ObjectMapper objectMapper;

    private final String regex = "(ft:)?(gpt).*";
    private final Pattern pattern = Pattern.compile(regex);

    public ChatCommand(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public Mono<List<Map<String, String>>> trigger(DatasourceConfiguration datasourceConfiguration) {

        // Authentication will already be valid at this point
        final BearerTokenAuth bearerTokenAuth = (BearerTokenAuth) datasourceConfiguration.getAuthentication();
        assert (bearerTokenAuth.getBearerToken() != null);

        HttpMethod httpMethod = HttpMethod.GET;
        URI uri = createTriggerUri();

        return RequestUtils.makeRequest(httpMethod, uri, bearerTokenAuth, BodyInserters.empty())
                .flatMap(responseEntity -> {
                    if (!responseEntity.getStatusCode().is2xxSuccessful()) {
                        return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_GET_STRUCTURE_ERROR));
                    }

                    try {
                        return Mono.just(objectMapper.readValue(
                                responseEntity.getBody(), new TypeReference<Map<String, Object>>() {}));
                    } catch (IOException ex) {
                        return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_GET_STRUCTURE_ERROR));
                    }
                })
                .map(data -> {
                    List<Map<String, String>> modelList = new ArrayList<>();

                    if (!data.containsKey(DATA)) {
                        return modelList;
                    }

                    List<Object> models = (List<Object>) data.get(DATA);
                    for (Object model : models) {

                        Map<String, Object> modelMap = (Map<String, Object>) model;

                        if (!modelMap.containsKey("id")) {
                            continue;
                        }

                        String modelId = (String) modelMap.get(ID);
                        if (!pattern.matcher(modelId).matches()) {
                            continue;
                        }

                        Map<String, String> responseMap = new HashMap<>();
                        responseMap.put("label", modelId);
                        responseMap.put("value", modelId);
                        modelList.add(responseMap);
                    }
                    return modelList;
                });
    }

    @Override
    public URI createTriggerUri() {
        return RequestUtils.createUriFromCommand(MODEL);
    }

    @Override
    public URI createExecutionUri() {
        return RequestUtils.createUriFromCommand(CHAT);
    }

    @Override
    public OpenAIRequestDTO makeRequestBody(ActionConfiguration actionConfiguration) {
        Map<String, Object> formData = actionConfiguration.getFormData();
        if (CollectionUtils.isEmpty(formData)) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                    String.format(STRING_APPENDER, EXECUTION_FAILURE, QUERY_NOT_CONFIGURED));
        }

        ChatRequestDTO chatRequestDTO = new ChatRequestDTO();
        String model = RequestUtils.extractDataFromFormData(formData, CHAT_MODEL_SELECTOR);

        if (!StringUtils.hasText(model)) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                    String.format(STRING_APPENDER, EXECUTION_FAILURE, MODEL_NOT_SELECTED));
        }

        chatRequestDTO.setModel(model);
        List<ChatMessage> chatMessages = transformToMessages((String) formData.get(MESSAGES));
        verifyRoleForChatMessages(chatMessages);

        Float temperature = getTemperatureFromFormData(formData);
        chatRequestDTO.setMessages(chatMessages);
        chatRequestDTO.setTemperature(temperature);
        return chatRequestDTO;
    }

    private List<ChatMessage> transformToMessages(String messages) {
        if (!StringUtils.hasText(messages)) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                    String.format(STRING_APPENDER, EXECUTION_FAILURE, INCORRECT_MESSAGE_FORMAT));
        }

        try {
            return objectMapper.readValue(messages, new TypeReference<List<ChatMessage>>() {});
        } catch (JsonProcessingException jsonProcessingException) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                    String.format(STRING_APPENDER, EXECUTION_FAILURE, INCORRECT_MESSAGE_FORMAT));
        }
    }

    private void verifyRoleForChatMessages(List<ChatMessage> chatMessages) {
        for (ChatMessage chatMessage : chatMessages) {
            if (chatMessage.getRole() == null) {
                throw new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                        String.format(STRING_APPENDER, EXECUTION_FAILURE, INCORRECT_ROLE_VALUE));
            }
        }
    }

    private Float getTemperatureFromFormData(Map<String, Object> formData) {
        float defaultFloatValue = 1.0f;
        String temperatureString = RequestUtils.extractValueFromFormData(formData, TEMPERATURE);

        if (!StringUtils.hasText(temperatureString)) {
            return defaultFloatValue;
        }

        try {
            float temperature = Float.parseFloat(temperatureString);
            return (temperature > 2.0f || temperature < 0.0f) ? defaultFloatValue : temperature;
        } catch (IllegalArgumentException illegalArgumentException) {
            return defaultFloatValue;
        } catch (Exception exception) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                    String.format(STRING_APPENDER, EXECUTION_FAILURE, BAD_TEMPERATURE_CONFIGURATION));
        }
    }
}
