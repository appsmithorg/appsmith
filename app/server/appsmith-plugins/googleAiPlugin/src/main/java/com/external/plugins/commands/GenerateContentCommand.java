package com.external.plugins.commands;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.ActionConfiguration;
import com.external.plugins.constants.GoogleAIConstants;
import com.external.plugins.models.GoogleAIRequestDTO;
import com.external.plugins.models.Role;
import com.external.plugins.utils.RequestUtils;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import org.springframework.http.HttpMethod;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import java.lang.reflect.Type;
import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static com.external.plugins.constants.GoogleAIConstants.CONTENT;
import static com.external.plugins.constants.GoogleAIConstants.DATA;
import static com.external.plugins.constants.GoogleAIConstants.GENERATE_CONTENT_MODEL;
import static com.external.plugins.constants.GoogleAIConstants.JSON;
import static com.external.plugins.constants.GoogleAIConstants.MESSAGES;
import static com.external.plugins.constants.GoogleAIConstants.ROLE;
import static com.external.plugins.constants.GoogleAIConstants.TYPE;
import static com.external.plugins.constants.GoogleAIConstants.VIEW_TYPE;
import static com.external.plugins.constants.GoogleAIErrorMessages.EXECUTION_FAILURE;
import static com.external.plugins.constants.GoogleAIErrorMessages.INCORRECT_MESSAGE_FORMAT;
import static com.external.plugins.constants.GoogleAIErrorMessages.MODEL_NOT_SELECTED;
import static com.external.plugins.constants.GoogleAIErrorMessages.QUERY_NOT_CONFIGURED;
import static com.external.plugins.constants.GoogleAIErrorMessages.STRING_APPENDER;

public class GenerateContentCommand implements GoogleAICommand {
    private final Gson gson = new Gson();

    @Override
    public HttpMethod getTriggerHTTPMethod() {
        return HttpMethod.GET;
    }

    @Override
    public HttpMethod getExecutionMethod() {
        return HttpMethod.POST;
    }

    /**
     * This will be implemented in later stage once we integrate all the functions provided by Google AI
     */
    @Override
    public URI createTriggerUri() {
        return URI.create("");
    }

    @Override
    public URI createExecutionUri(ActionConfiguration actionConfiguration) {
        return RequestUtils.createUriFromCommand(GoogleAIConstants.GENERATE_CONTENT, selectModel(actionConfiguration));
    }

    private String selectModel(ActionConfiguration actionConfiguration) {
        if (actionConfiguration != null
                && actionConfiguration.getFormData() != null
                && actionConfiguration.getFormData().containsKey(GENERATE_CONTENT_MODEL)) {
            return ((Map<String, String>) actionConfiguration.getFormData().get(GENERATE_CONTENT_MODEL)).get(DATA);
        }
        // throw error if no model selected
        throw new AppsmithPluginException(
                AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                "No generate content model is selected in the configuration");
    }

    @Override
    public GoogleAIRequestDTO makeRequestBody(ActionConfiguration actionConfiguration) {
        Map<String, Object> formData = actionConfiguration.getFormData();
        GoogleAIRequestDTO googleAIRequestDTO = new GoogleAIRequestDTO();
        List<Map<String, String>> messages = getMessages((Map<String, Object>) formData.get(MESSAGES));
        if (messages == null || messages.isEmpty()) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                    String.format(STRING_APPENDER, EXECUTION_FAILURE, INCORRECT_MESSAGE_FORMAT));
        }
        // as of today, we are going to support only text input to text output, so we will condense user messages in
        // a single content parts of request body
        List<GoogleAIRequestDTO.Part> userQueryParts = new ArrayList<>();
        for (Map<String, String> message : messages) {
            if (message.containsKey(ROLE) && message.containsKey(TYPE) && message.containsKey(CONTENT)) {
                String role = message.get(ROLE);
                String type = message.get(TYPE);
                String content = message.get(CONTENT);
                if (content.isEmpty()) {
                    continue;
                }

                if (Role.USER.getValue().equals(role)
                        && com.external.plugins.models.Type.TEXT.toString().equals(type)) {
                    userQueryParts.add(new GoogleAIRequestDTO.Part(content));
                }
            }
        }
        // no content is configured completely
        if (userQueryParts.isEmpty()) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                    String.format(STRING_APPENDER, EXECUTION_FAILURE, INCORRECT_MESSAGE_FORMAT));
        }
        googleAIRequestDTO.setContents(List.of(new GoogleAIRequestDTO.Content(Role.USER, userQueryParts)));
        return googleAIRequestDTO;
    }

    /**
     * Place all necessary validation checks here
     */
    @Override
    public void validateRequest(ActionConfiguration actionConfiguration) {
        Map<String, Object> formData = actionConfiguration.getFormData();
        if (CollectionUtils.isEmpty(formData)) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                    String.format(STRING_APPENDER, EXECUTION_FAILURE, QUERY_NOT_CONFIGURED));
        }

        String model = RequestUtils.extractDataFromFormData(formData, GENERATE_CONTENT_MODEL);
        if (!StringUtils.hasText(model)) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                    String.format(STRING_APPENDER, EXECUTION_FAILURE, MODEL_NOT_SELECTED));
        }
        if (!formData.containsKey(MESSAGES) || formData.get(MESSAGES) == null) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                    String.format(STRING_APPENDER, EXECUTION_FAILURE, INCORRECT_MESSAGE_FORMAT));
        }
    }

    /**
     * When JS is enabled in form component, value is stored in data key only. Difference is if viewType is json,
     * it's stored as JSON string otherwise it's Java serialized object
     */
    private List<Map<String, String>> getMessages(Map<String, Object> messages) {
        Type listType = new TypeToken<List<Map<String, String>>>() {}.getType();
        if (messages.containsKey(VIEW_TYPE) && JSON.equals(messages.get(VIEW_TYPE))) {
            // data is present in data key as String
            return gson.fromJson((String) messages.get(DATA), listType);
        }
        // return object stored in data key
        return (List<Map<String, String>>) messages.get(DATA);
    }
}
