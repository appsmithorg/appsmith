package com.external.plugins.commands;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.ActionConfiguration;
import com.external.plugins.constants.AnthropicConstants;
import com.external.plugins.models.AnthropicRequestDTO;
import com.external.plugins.utils.RequestUtils;
import org.springframework.http.HttpMethod;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.List;
import java.util.Map;

import static com.external.plugins.constants.AnthropicConstants.ANTHROPIC;
import static com.external.plugins.constants.AnthropicConstants.CHAT;
import static com.external.plugins.constants.AnthropicConstants.CHAT_MODEL_SELECTOR;
import static com.external.plugins.constants.AnthropicConstants.CLOUD_SERVICES;
import static com.external.plugins.constants.AnthropicConstants.COMMAND;
import static com.external.plugins.constants.AnthropicConstants.COMPONENT_DATA;
import static com.external.plugins.constants.AnthropicConstants.CONTENT;
import static com.external.plugins.constants.AnthropicConstants.DATA;
import static com.external.plugins.constants.AnthropicConstants.DEFAULT_MAX_TOKEN;
import static com.external.plugins.constants.AnthropicConstants.DEFAULT_TEMPERATURE;
import static com.external.plugins.constants.AnthropicConstants.MAX_TOKENS;
import static com.external.plugins.constants.AnthropicConstants.MESSAGES;
import static com.external.plugins.constants.AnthropicConstants.MODELS_API;
import static com.external.plugins.constants.AnthropicConstants.PROVIDER;
import static com.external.plugins.constants.AnthropicConstants.ROLE;
import static com.external.plugins.constants.AnthropicConstants.ROLE_ASSISTANT;
import static com.external.plugins.constants.AnthropicConstants.TEMPERATURE;
import static com.external.plugins.constants.AnthropicErrorMessages.BAD_MAX_TOKEN_CONFIGURATION;
import static com.external.plugins.constants.AnthropicErrorMessages.BAD_TEMPERATURE_CONFIGURATION;
import static com.external.plugins.constants.AnthropicErrorMessages.EXECUTION_FAILURE;
import static com.external.plugins.constants.AnthropicErrorMessages.MODEL_NOT_SELECTED;
import static com.external.plugins.constants.AnthropicErrorMessages.QUERY_NOT_CONFIGURED;
import static com.external.plugins.constants.AnthropicErrorMessages.STRING_APPENDER;

public class ChatCommand implements AnthropicCommand {
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
                .queryParam(COMMAND, CHAT.toLowerCase())
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

        anthropicRequestDTO.setModel(model);

        Float temperature = getTemperatureFromFormData(formData);
        anthropicRequestDTO.setTemperature(temperature);
        anthropicRequestDTO.setMaxTokensToSample(getMaxTokenFromFormData(formData));
        anthropicRequestDTO.setPrompt(createPrompt(formData));
        return anthropicRequestDTO;
    }

    /**
     * This is the kind of format we want to build from the messages as a prompt.
     * Example Prompt: `\n\nHuman: ${query}\n\nAssistant:`
     * Lastly, we leave it with an additional Assistant: so that it can respond back as an assistant
     */
    private String createPrompt(Map<String, Object> formData) {
        StringBuilder stringBuilder = new StringBuilder();
        if (formData.containsKey(MESSAGES)) {
            boolean isComponentData = ((Map) formData.get(MESSAGES)).containsKey(COMPONENT_DATA);
            String dataKey = isComponentData ? COMPONENT_DATA : DATA;
            List<Map<String, String>> messagesMap =
                    (List<Map<String, String>>) ((Map<?, ?>) formData.get(MESSAGES)).get(dataKey);
            for (Map<String, String> message : messagesMap) {
                if (message.containsKey(ROLE) && message.containsKey(CONTENT)) {
                    stringBuilder
                            .append("\n\n")
                            .append(message.get(ROLE))
                            .append(": ")
                            .append(message.get(CONTENT));
                }
            }
            return stringBuilder.append("\n").append(ROLE_ASSISTANT).append(":").toString();
        } else {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                    "messages are not provided in the configuration");
        }
    }

    private int getMaxTokenFromFormData(Map<String, Object> formData) {
        String maxTokenAsString = RequestUtils.extractValueFromFormData(formData, MAX_TOKENS);

        if (!StringUtils.hasText(maxTokenAsString)) {
            return DEFAULT_MAX_TOKEN;
        }

        try {
            return Integer.parseInt(maxTokenAsString);
        } catch (IllegalArgumentException illegalArgumentException) {
            return DEFAULT_MAX_TOKEN;
        } catch (Exception exception) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                    String.format(STRING_APPENDER, EXECUTION_FAILURE, BAD_MAX_TOKEN_CONFIGURATION));
        }
    }

    private Float getTemperatureFromFormData(Map<String, Object> formData) {
        String temperatureString = RequestUtils.extractValueFromFormData(formData, TEMPERATURE);

        if (!StringUtils.hasText(temperatureString)) {
            return DEFAULT_TEMPERATURE;
        }

        try {
            return Float.parseFloat(temperatureString);
        } catch (IllegalArgumentException illegalArgumentException) {
            return DEFAULT_TEMPERATURE;
        } catch (Exception exception) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                    String.format(STRING_APPENDER, EXECUTION_FAILURE, BAD_TEMPERATURE_CONFIGURATION));
        }
    }
}
