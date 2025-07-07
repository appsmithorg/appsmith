package com.external.plugins.commands;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.DatasourceConfiguration;
import com.external.plugins.models.ChatMessage;
import com.external.plugins.models.ChatRequestDTO;
import com.external.plugins.models.AIRequestDTO;
import com.external.plugins.utils.MessageUtils;
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

import static com.external.plugins.constants.DeepseekAIConstants.CHAT;
import static com.external.plugins.constants.DeepseekAIConstants.CHAT_MODEL_SELECTOR;
import static com.external.plugins.constants.DeepseekAIConstants.ID;
import static com.external.plugins.constants.DeepseekAIConstants.LABEL;
import static com.external.plugins.constants.DeepseekAIConstants.MESSAGES;
import static com.external.plugins.constants.DeepseekAIConstants.MODEL;
import static com.external.plugins.constants.DeepseekAIConstants.TEMPERATURE;
import static com.external.plugins.constants.DeepseekAIConstants.VALUE;
import static com.external.plugins.constants.DeepseekAIErrorMessages.BAD_TEMPERATURE_CONFIGURATION;
import static com.external.plugins.constants.DeepseekAIErrorMessages.EXECUTION_FAILURE;
import static com.external.plugins.constants.DeepseekAIErrorMessages.INCORRECT_MESSAGE_FORMAT;
import static com.external.plugins.constants.DeepseekAIErrorMessages.INCORRECT_ROLE_VALUE;
import static com.external.plugins.constants.DeepseekAIErrorMessages.MODEL_NOT_SELECTED;
import static com.external.plugins.constants.DeepseekAIErrorMessages.QUERY_NOT_CONFIGURED;
import static com.external.plugins.constants.DeepseekAIErrorMessages.STRING_APPENDER;
import static com.external.plugins.constants.DeepseekAIErrorMessages.BAD_FREQUENCY_PENALTY_CONFIGURATION;
import static com.external.plugins.constants.DeepseekAIErrorMessages.BAD_MAX_TOKEN_CONFIGURATION;
import static com.external.plugins.constants.DeepseekAIErrorMessages.BAD_PRESENCE_PENALTY_CONFIGURATION;
import static com.external.plugins.constants.DeepseekAIErrorMessages.BAD_TOP_P_CONFIGURATION;
import static com.external.plugins.constants.DeepseekAIConstants.FREQUENCY_PENALTY;
import static com.external.plugins.constants.DeepseekAIConstants.MAX_TOKENS;
import static com.external.plugins.constants.DeepseekAIConstants.PRESENCE_PENALTY;
import static com.external.plugins.constants.DeepseekAIConstants.STREAM;
import static com.external.plugins.constants.DeepseekAIConstants.TOP_P;




@Slf4j
public class ChatCommand implements AICommand {

    private final Gson gson;

    private final String regex = "^(?!.*vision)(ft:)?deepseek.*";
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
    public URI createTriggerUri(DatasourceConfiguration datasourceConfiguration) {
        return RequestUtils.createUriFromCommand(MODEL,datasourceConfiguration);
    }

    @Override
    public URI createExecutionUri(DatasourceConfiguration datasourceConfiguration) {
        return RequestUtils.createUriFromCommand(CHAT,datasourceConfiguration);
    }

    @Override
    public AIRequestDTO makeRequestBody(ActionConfiguration actionConfiguration) {
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
        List<ChatMessage> chatMessages =
                transformToMessages(MessageUtils.extractMessages((Map<String, Object>) formData.get(MESSAGES)));
        verifyRoleForChatMessages(chatMessages);
        chatRequestDTO.setMessages(chatMessages);

        chatRequestDTO.setTemperature(getTemperatureFromFormData(formData));
        chatRequestDTO.setTop_p(getTopPFromFormData(formData));
        chatRequestDTO.setFrequency_penalty(getFrequencyPenaltyFromFormData(formData));
        chatRequestDTO.setPresence_penalty(getPresencePenaltyFromFormData(formData));
        chatRequestDTO.setMax_tokens(getMaxTokensFromFormData(formData));
        chatRequestDTO.setStream(RequestUtils.extractBooleanValueFromFormData(formData, STREAM));
        
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

    private Float getTopPFromFormData(Map<String, Object> formData) {
        float defaultFloatValue = 1.0f;
        String topPString = RequestUtils.extractValueFromFormData(formData, TOP_P);

        if (!StringUtils.hasText(topPString)) {
            return defaultFloatValue;
        }

        try {
            return Float.parseFloat(topPString);
        } catch (IllegalArgumentException illegalArgumentException) {
            return defaultFloatValue;
        } catch (Exception exception) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                    String.format(STRING_APPENDER, EXECUTION_FAILURE, BAD_TOP_P_CONFIGURATION));
        }
    }

    private Float getFrequencyPenaltyFromFormData(Map<String, Object> formData) {
        float defaultFloatValue = 0.0f;
        String frequencyPenaltyString = RequestUtils.extractValueFromFormData(formData, FREQUENCY_PENALTY);

        if (!StringUtils.hasText(frequencyPenaltyString)) {
            return defaultFloatValue;
        }

        try {
            return Float.parseFloat(frequencyPenaltyString);
        } catch (IllegalArgumentException illegalArgumentException) {
            return defaultFloatValue;
        } catch (Exception exception) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                    String.format(STRING_APPENDER, EXECUTION_FAILURE, BAD_FREQUENCY_PENALTY_CONFIGURATION));
        }
    }

    private Float getPresencePenaltyFromFormData(Map<String, Object> formData) {
        float defaultFloatValue = 0.0f;
        String presencePenaltyString = RequestUtils.extractValueFromFormData(formData, PRESENCE_PENALTY);

        if (!StringUtils.hasText(presencePenaltyString)) {
            return defaultFloatValue;
        }

        try {
            return Float.parseFloat(presencePenaltyString);
        } catch (IllegalArgumentException illegalArgumentException) {
            return defaultFloatValue;
        } catch (Exception exception) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                    String.format(STRING_APPENDER, EXECUTION_FAILURE, BAD_PRESENCE_PENALTY_CONFIGURATION));
        }
    }

    private int getMaxTokensFromFormData(Map<String, Object> formData) {
        int defaultIntValue = 2048;
        String maxTokensString = RequestUtils.extractValueFromFormData(formData, MAX_TOKENS);

        if (!StringUtils.hasText(maxTokensString)) {
            return defaultIntValue;
        }

        try {
            return Integer.parseInt(maxTokensString);
        } catch (IllegalArgumentException illegalArgumentException) {
            return defaultIntValue;
        } catch (Exception exception) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                    String.format(STRING_APPENDER, EXECUTION_FAILURE, BAD_MAX_TOKEN_CONFIGURATION));
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
