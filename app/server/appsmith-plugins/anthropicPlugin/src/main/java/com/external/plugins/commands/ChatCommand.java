package com.external.plugins.commands;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.ActionConfiguration;
import com.external.plugins.constants.AnthropicConstants;
import com.external.plugins.models.AnthropicRequestDTO;
import com.external.plugins.models.Message;
import com.external.plugins.utils.CommandUtils;
import com.external.plugins.utils.RequestUtils;
import com.google.gson.Gson;
import org.springframework.http.HttpMethod;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static com.external.plugins.constants.AnthropicConstants.ANTHROPIC;
import static com.external.plugins.constants.AnthropicConstants.CHAT_MODEL_SELECTOR;
import static com.external.plugins.constants.AnthropicConstants.CHAT_V2;
import static com.external.plugins.constants.AnthropicConstants.CLOUD_SERVICES;
import static com.external.plugins.constants.AnthropicConstants.COMMAND;
import static com.external.plugins.constants.AnthropicConstants.CONTENT;
import static com.external.plugins.constants.AnthropicConstants.MESSAGES;
import static com.external.plugins.constants.AnthropicConstants.MODELS_API;
import static com.external.plugins.constants.AnthropicConstants.PROVIDER;
import static com.external.plugins.constants.AnthropicConstants.ROLE;
import static com.external.plugins.constants.AnthropicConstants.SYSTEM_PROMPT;
import static com.external.plugins.constants.AnthropicErrorMessages.EXECUTION_FAILURE;
import static com.external.plugins.constants.AnthropicErrorMessages.MODEL_NOT_SELECTED;
import static com.external.plugins.constants.AnthropicErrorMessages.QUERY_NOT_CONFIGURED;
import static com.external.plugins.constants.AnthropicErrorMessages.STRING_APPENDER;
import static com.external.plugins.utils.CommandUtils.getMaxTokenFromFormData;
import static com.external.plugins.utils.CommandUtils.getMessages;
import static com.external.plugins.utils.CommandUtils.getTemperatureFromFormData;

public class ChatCommand implements AnthropicCommand {
    private final Gson gson = new Gson();

    @Override
    public HttpMethod getTriggerHTTPMethod() {
        return HttpMethod.GET;
    }

    @Override
    public HttpMethod getExecutionMethod() {
        return HttpMethod.POST;
    }

    @Override
    public URI createTriggerUri() {
        return UriComponentsBuilder.fromUriString(CLOUD_SERVICES + MODELS_API)
                .queryParam(PROVIDER, ANTHROPIC)
                .queryParam(COMMAND, CHAT_V2)
                .build()
                .toUri();
    }

    @Override
    public URI createExecutionUri() {
        return RequestUtils.createUriFromCommand(AnthropicConstants.CHAT);
    }

    @Override
    public AnthropicRequestDTO makeRequestBody(ActionConfiguration actionConfiguration) {
        Map<String, Object> formData = actionConfiguration.getFormData();
        if (CollectionUtils.isEmpty(formData)) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                    String.format(STRING_APPENDER, EXECUTION_FAILURE, QUERY_NOT_CONFIGURED));
        }

        AnthropicRequestDTO anthropicRequestDTO = new AnthropicRequestDTO();
        String model = RequestUtils.extractDataFromFormData(formData, CHAT_MODEL_SELECTOR);

        if (!StringUtils.hasText(model)) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                    String.format(STRING_APPENDER, EXECUTION_FAILURE, MODEL_NOT_SELECTED));
        }
        Float temperature = getTemperatureFromFormData(formData);
        anthropicRequestDTO.setTemperature(temperature);
        anthropicRequestDTO.setModel(model);

        anthropicRequestDTO.setMaxTokens(getMaxTokenFromFormData(formData));
        anthropicRequestDTO.setMessages(createMessages(formData));
        if (formData.containsKey(SYSTEM_PROMPT) && formData.get(SYSTEM_PROMPT) != null) {
            anthropicRequestDTO.setSystem(RequestUtils.extractDataFromFormData(formData, SYSTEM_PROMPT));
        }

        return anthropicRequestDTO;
    }

    private List<Message> createMessages(Map<String, Object> formData) {
        if (!formData.containsKey(MESSAGES)) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                    "messages are not provided in the configuration");
        }
        List<Map<String, String>> messageMaps = getMessages((Map<String, Object>) formData.get(MESSAGES));
        if (messageMaps == null) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                    "messages are not provided in the configuration correctly");
        }
        List<Message> messages = new ArrayList<>();
        for (Map<String, String> messageMap : messageMaps) {
            if (messageMap != null && messageMap.containsKey(ROLE) && messageMap.containsKey(CONTENT)) {
                Message message = new Message();
                Message.TextContent textContent = new Message.TextContent();
                textContent.setText(messageMap.get(CONTENT));

                message.setRole(CommandUtils.getActualRoleValue(messageMap.get(ROLE)));
                message.setContent(List.of(textContent));

                messages.add(message);
            }
        }
        return messages;
    }
}
