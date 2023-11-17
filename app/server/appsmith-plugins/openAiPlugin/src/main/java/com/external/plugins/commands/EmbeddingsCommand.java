package com.external.plugins.commands;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.ActionConfiguration;
import com.external.plugins.models.EmbeddingRequestDTO;
import com.external.plugins.models.EncodingFormat;
import com.external.plugins.models.OpenAIRequestDTO;
import com.external.plugins.utils.RequestUtils;
import com.google.gson.Gson;
import org.json.JSONObject;
import org.springframework.http.HttpMethod;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import java.net.URI;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Pattern;

import static com.external.plugins.constants.OpenAIConstants.EMBEDDINGS;
import static com.external.plugins.constants.OpenAIConstants.EMBEDDINGS_MODEL_SELECTOR;
import static com.external.plugins.constants.OpenAIConstants.ENCODING_FORMAT;
import static com.external.plugins.constants.OpenAIConstants.ID;
import static com.external.plugins.constants.OpenAIConstants.INPUT;
import static com.external.plugins.constants.OpenAIConstants.LABEL;
import static com.external.plugins.constants.OpenAIConstants.MODEL;
import static com.external.plugins.constants.OpenAIConstants.VALUE;
import static com.external.plugins.constants.OpenAIErrorMessages.ENCODING_CONVERSION_ERROR;
import static com.external.plugins.constants.OpenAIErrorMessages.EXECUTION_FAILURE;
import static com.external.plugins.constants.OpenAIErrorMessages.INPUT_NOT_CONFIGURED;
import static com.external.plugins.constants.OpenAIErrorMessages.MODEL_NOT_SELECTED;
import static com.external.plugins.constants.OpenAIErrorMessages.QUERY_NOT_CONFIGURED;
import static com.external.plugins.constants.OpenAIErrorMessages.STRING_APPENDER;
import static com.external.plugins.utils.RequestUtils.extractDataFromFormData;

public class EmbeddingsCommand implements OpenAICommand {

    private final Gson gson;
    private final String regex = "(ft:)?(text-embedding).*";
    private final Pattern pattern = Pattern.compile(regex);

    public EmbeddingsCommand(Gson gson) {
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
        return RequestUtils.createUriFromCommand(EMBEDDINGS);
    }

    @Override
    public OpenAIRequestDTO makeRequestBody(ActionConfiguration actionConfiguration) {
        Map<String, Object> formData = actionConfiguration.getFormData();
        if (CollectionUtils.isEmpty(formData)) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                    String.format(STRING_APPENDER, EXECUTION_FAILURE, QUERY_NOT_CONFIGURED));
        }

        EmbeddingRequestDTO embeddings = new EmbeddingRequestDTO();

        String model = extractDataFromFormData(formData, EMBEDDINGS_MODEL_SELECTOR);
        if (!StringUtils.hasText(model)) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                    String.format(STRING_APPENDER, EXECUTION_FAILURE, MODEL_NOT_SELECTED));
        }

        // TODO: write separate logic for elaborate parsing
        String input = (String) formData.get(INPUT);
        if (!StringUtils.hasText(input)) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                    String.format(STRING_APPENDER, EXECUTION_FAILURE, INPUT_NOT_CONFIGURED));
        }

        EncodingFormat encodingFormat = getEncodingFormatFromFormData(formData);

        embeddings.setModel(model);
        embeddings.setInput(input);
        embeddings.setEncodingFormat(encodingFormat);
        return embeddings;
    }

    private EncodingFormat getEncodingFormatFromFormData(Map<String, Object> formData) {
        EncodingFormat defaultEncodingFormat = EncodingFormat.FLOAT;
        String encodingFormatString = RequestUtils.extractValueFromFormData(formData, ENCODING_FORMAT);

        if (!StringUtils.hasText(encodingFormatString)) {
            return defaultEncodingFormat;
        }

        try {
            return Enum.valueOf(EncodingFormat.class, encodingFormatString.toUpperCase());
        } catch (IllegalArgumentException illegalArgumentException) {
            return defaultEncodingFormat;
        } catch (Exception exception) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                    String.format(STRING_APPENDER, EXECUTION_FAILURE, ENCODING_CONVERSION_ERROR));
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
