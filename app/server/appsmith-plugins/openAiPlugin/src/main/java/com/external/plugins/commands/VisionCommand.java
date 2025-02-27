package com.external.plugins.commands;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.ActionConfiguration;
import com.external.plugins.models.OpenAIRequestDTO;
import com.external.plugins.models.QueryType;
import com.external.plugins.models.Role;
import com.external.plugins.models.UserImageContent;
import com.external.plugins.models.UserQuery;
import com.external.plugins.models.UserTextContent;
import com.external.plugins.models.VisionMessage;
import com.external.plugins.models.VisionRequestDTO;
import com.external.plugins.utils.MessageUtils;
import com.external.plugins.utils.RequestUtils;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.http.HttpMethod;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import java.lang.reflect.Type;
import java.net.URI;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

import static com.external.plugins.constants.OpenAIConstants.CONTENT;
import static com.external.plugins.constants.OpenAIConstants.DEFAULT_MAX_TOKEN;
import static com.external.plugins.constants.OpenAIConstants.ID;
import static com.external.plugins.constants.OpenAIConstants.IMAGE_TYPE;
import static com.external.plugins.constants.OpenAIConstants.LABEL;
import static com.external.plugins.constants.OpenAIConstants.MAX_TOKENS;
import static com.external.plugins.constants.OpenAIConstants.MODEL;
import static com.external.plugins.constants.OpenAIConstants.SYSTEM_MESSAGES;
import static com.external.plugins.constants.OpenAIConstants.TEMPERATURE;
import static com.external.plugins.constants.OpenAIConstants.TEXT_TYPE;
import static com.external.plugins.constants.OpenAIConstants.USER_MESSAGES;
import static com.external.plugins.constants.OpenAIConstants.VALUE;
import static com.external.plugins.constants.OpenAIConstants.VISION;
import static com.external.plugins.constants.OpenAIConstants.VISION_MODEL_SELECTOR;
import static com.external.plugins.constants.OpenAIErrorMessages.BAD_MAX_TOKEN_CONFIGURATION;
import static com.external.plugins.constants.OpenAIErrorMessages.BAD_TEMPERATURE_CONFIGURATION;
import static com.external.plugins.constants.OpenAIErrorMessages.EXECUTION_FAILURE;
import static com.external.plugins.constants.OpenAIErrorMessages.INCORRECT_SYSTEM_MESSAGE_FORMAT;
import static com.external.plugins.constants.OpenAIErrorMessages.INCORRECT_USER_MESSAGE_FORMAT;
import static com.external.plugins.constants.OpenAIErrorMessages.MODEL_NOT_SELECTED;
import static com.external.plugins.constants.OpenAIErrorMessages.QUERY_NOT_CONFIGURED;
import static com.external.plugins.constants.OpenAIErrorMessages.STRING_APPENDER;

@Slf4j
@RequiredArgsConstructor
public class VisionCommand implements OpenAICommand {

    private final Gson gson;

    private final String regex =
            "^(gpt-4-(vision-preview|\\d{4}-vision-preview)|gpt-4o(.*)?|ft:(gpt-4-(vision-preview|\\d{4}-vision-preview)|gpt-4o).*)$";
    private final Pattern pattern = Pattern.compile(regex);

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
        return RequestUtils.createUriFromCommand(VISION);
    }

    @Override
    public OpenAIRequestDTO makeRequestBody(ActionConfiguration actionConfiguration) {
        Map<String, Object> formData = actionConfiguration.getFormData();
        if (CollectionUtils.isEmpty(formData)) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                    String.format(STRING_APPENDER, EXECUTION_FAILURE, QUERY_NOT_CONFIGURED));
        }

        VisionRequestDTO visionRequestDTO = new VisionRequestDTO();
        String model = RequestUtils.extractDataFromFormData(formData, VISION_MODEL_SELECTOR);

        if (!StringUtils.hasText(model)) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                    String.format(STRING_APPENDER, EXECUTION_FAILURE, MODEL_NOT_SELECTED));
        }

        visionRequestDTO.setModel(model);

        List<VisionMessage> visionMessages = transformSystemMessages(
                MessageUtils.extractMessages((Map<String, Object>) formData.get(SYSTEM_MESSAGES)));
        visionMessages.addAll(
                transformUserMessages(MessageUtils.extractMessages((Map<String, Object>) formData.get(USER_MESSAGES))));
        Float temperature = getTemperatureFromFormData(formData);

        visionRequestDTO.setMessages(visionMessages);
        visionRequestDTO.setMaxTokens(getMaxTokenFromFormData(formData));
        visionRequestDTO.setTemperature(temperature);
        return visionRequestDTO;
    }

    private List<VisionMessage> transformUserMessages(Object messages) {
        if (messages == null) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                    String.format(STRING_APPENDER, EXECUTION_FAILURE, INCORRECT_USER_MESSAGE_FORMAT));
        }

        Type chatListType = new TypeToken<List<UserQuery>>() {}.getType();
        try {
            List<UserQuery> userQueries = gson.fromJson(gson.toJson(messages), chatListType);

            VisionMessage visionMessage = new VisionMessage();
            visionMessage.setContent(new ArrayList<>());
            visionMessage.setRole(Role.user);

            for (UserQuery userQuery : userQueries) {
                if (QueryType.TEXT.equals(userQuery.getType())) {
                    UserTextContent userContent = new UserTextContent();
                    userContent.setType(TEXT_TYPE);
                    userContent.setText(userQuery.getContent());
                    ((List<Object>) visionMessage.getContent()).add(userContent);
                } else if (QueryType.IMAGE.equals(userQuery.getType())) {
                    UserImageContent userContent = new UserImageContent();
                    userContent.setType(IMAGE_TYPE);
                    userContent.setImageUrl(new UserImageContent.ImageUrl(userQuery.getContent()));
                    ((List<Object>) visionMessage.getContent()).add(userContent);
                }
            }
            return List.of(visionMessage);
        } catch (Exception exception) {
            log.debug("An exception occurred while converting types for user messages: {}", messages);
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                    String.format(STRING_APPENDER, EXECUTION_FAILURE, INCORRECT_USER_MESSAGE_FORMAT));
        }
    }

    private List<VisionMessage> transformSystemMessages(Object messages) {
        List<VisionMessage> visionMessages = new ArrayList<>();

        if (messages == null) {
            return visionMessages;
        }

        Type chatListType = new TypeToken<List<LinkedHashMap<String, String>>>() {}.getType();
        try {
            List<LinkedHashMap<String, String>> systemMessagesMap = gson.fromJson(gson.toJson(messages), chatListType);

            for (Map<String, String> systemMessageMap : systemMessagesMap) {
                VisionMessage visionMessage = new VisionMessage();
                if (StringUtils.hasText(systemMessageMap.get(CONTENT))) {
                    visionMessage.setRole(Role.system);
                    visionMessage.setContent(systemMessageMap.get(CONTENT));
                    visionMessages.add(visionMessage);
                }
            }
            return visionMessages;
        } catch (Exception exception) {
            log.debug("An exception occurred while converting types for system messages: {}", messages);
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                    String.format(STRING_APPENDER, EXECUTION_FAILURE, INCORRECT_SYSTEM_MESSAGE_FORMAT));
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
