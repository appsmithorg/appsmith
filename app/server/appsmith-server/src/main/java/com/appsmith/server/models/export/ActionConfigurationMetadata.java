package com.appsmith.server.modals;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpMethod;

import com.appsmith.external.converters.HttpMethodConverter;
import com.appsmith.external.models.JSValue;
import com.appsmith.external.models.PaginationType;
import com.appsmith.external.models.Property;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.google.gson.annotations.JsonAdapter;

public class ActionConfigurationMetadata {
    Integer timeoutInMillisecond;
    PaginationType paginationType = PaginationType.NONE;

    // API fields
    String path;
    List<Property> headers;
    Boolean encodeParamsToggle = true;
    List<Property> queryParameters;

    @JsonIgnore
    String body;
    // For form-data input instead of json use the following
    List<Property> bodyFormData;
    // For route parameters extracted from rapid-api
    List<Property> routeParameters;
    // All the following adapters are registered so that we can serialize between enum HttpMethod,
    // and what is now the class HttpMethod
    @JsonSerialize(using = HttpMethodConverter.HttpMethodSerializer.class)
    @JsonDeserialize(using = HttpMethodConverter.HttpMethodDeserializer.class)
    @JsonAdapter(HttpMethodConverter.class)
    HttpMethod httpMethod;
    // Paginated API fields
    String next;
    String prev;

    // DB action fields

    // JS action fields
    // Body, the raw class data, is shared with API type actions
    // Represents the values that need to be
    List<JSValue> jsArguments;
    Boolean isAsync;
    Boolean isValid;

    /*
     * Future plugins could require more fields that are not covered above.
     * They will have to represented in a key-value format where the plugin
     * understands what the keys stand for.
     */
    List<Property> pluginSpecifiedTemplates;

    /*
     * After porting plugins to UQI, we should be able to use a map for referring to form data
     * instead of a list of properties
     */
    Map<String, Object> formData;
}
