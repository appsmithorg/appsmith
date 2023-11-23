package com.external.plugins.commands;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.ActionConfiguration;
import com.external.plugins.models.ChatMessage;
import com.external.plugins.models.ChatRequestDTO;
import com.external.plugins.models.OpenAIRequestDTO;
import com.external.plugins.utils.RequestUtils;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.http.HttpMethod;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import java.lang.reflect.Type;
import java.net.URI;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

import static com.external.plugins.constants.OpenAIConstants.CHAT;
import static com.external.plugins.constants.OpenAIConstants.CHAT_MODEL_SELECTOR;
import static com.external.plugins.constants.OpenAIConstants.ID;
import static com.external.plugins.constants.OpenAIConstants.LABEL;
import static com.external.plugins.constants.OpenAIConstants.MESSAGES;
import static com.external.plugins.constants.OpenAIConstants.MODEL;
import static com.external.plugins.constants.OpenAIConstants.TEMPERATURE;
import static com.external.plugins.constants.OpenAIConstants.VALUE;
import static com.external.plugins.constants.OpenAIErrorMessages.BAD_TEMPERATURE_CONFIGURATION;
import static com.external.plugins.constants.OpenAIErrorMessages.EXECUTION_FAILURE;
import static com.external.plugins.constants.OpenAIErrorMessages.INCORRECT_MESSAGE_FORMAT;
import static com.external.plugins.constants.OpenAIErrorMessages.INCORRECT_ROLE_VALUE;
import static com.external.plugins.constants.OpenAIErrorMessages.MODEL_NOT_SELECTED;
import static com.external.plugins.constants.OpenAIErrorMessages.QUERY_NOT_CONFIGURED;
import static com.external.plugins.constants.OpenAIErrorMessages.STRING_APPENDER;

@Slf4j
public class ChatCommand implements OpenAICommand {

    private final Gson gson;

    private final String regex = "^(?!.*vision)(ft:)?gpt.*";
    private final Pattern pattern = Pattern.compile(regex);

    public ChatCommand(Gson gson) {
        this.gson = gson;
    }

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
        // this will change to objects
        List<ChatMessage> chatMessages = transformToMessages(formData.get(MESSAGES));
        verifyRoleForChatMessages(chatMessages);

        Float temperature = getTemperatureFromFormData(formData);
        chatRequestDTO.setMessages(chatMessages);
        chatRequestDTO.setTemperature(temperature);
        return chatRequestDTO;
    }

    private List<ChatMessage> transformToMessages(Object messages) {
        if (messages == null) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                    String.format(STRING_APPENDER, EXECUTION_FAILURE, INCORRECT_MESSAGE_FORMAT));
        }

        Type chatListType = new TypeToken<List<ChatMessage>>() {}.getType();
        try {
            return gson.fromJson(gson.toJson(messages), chatListType);
        } catch (Exception exception) {
            log.debug("An exception occurred while converting types for messages: {}", messages);
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
            return Float.parseFloat(temperatureString);
        } catch (IllegalArgumentException illegalArgumentException) {
            return defaultFloatValue;
        } catch (Exception exception) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                    String.format(STRING_APPENDER, EXECUTION_FAILURE, BAD_TEMPERATURE_CONFIGURATION));
        }
    }

    @Override
    public Boolean isModelCompatible(JSONObject modelJsonObject) {
        if (!modelJsonObject.has(ID)) {
            return false;
        }

        return pattern.matcher(modelJsonObject.getString(ID)).matches();
    }

    @Override
    public Map<String, String> getModelMap(JSONObject modelJsonObject) {
        Map<String, String> modelMap = new HashMap<>();
        modelMap.put(LABEL, modelJsonObject.getString(ID));
        modelMap.put(VALUE, modelJsonObject.getString(ID));
        return modelMap;
    }
}
