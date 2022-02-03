package com.appsmith.external.models;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.hibernate.validator.constraints.Range;
import org.springframework.data.annotation.Transient;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.http.HttpMethod;

import java.util.List;
import java.util.Map;

import static com.appsmith.external.constants.ActionConstants.DEFAULT_ACTION_EXECUTION_TIMEOUT_MS;

@Getter
@Setter
@ToString
@NoArgsConstructor
@Document
public class ActionConfiguration implements AppsmithDomain {
    private static final int MIN_TIMEOUT_VALUE = 0;     // in Milliseconds
    private static final int MAX_TIMEOUT_VALUE = 60000; // in Milliseconds
    private static final String TIMEOUT_OUT_OF_RANGE_MESSAGE = "'Query timeout' field must be an integer between "
            + MIN_TIMEOUT_VALUE + " and " + MAX_TIMEOUT_VALUE;
    /*
     * Any of the fields mentioned below could be represented in mustache
     * template. If the mustache template is found, it would be replaced
     * realtime every time the action needs to be executed. If no {{}} braces
     * are found, that implies the configuration is global for this action.
     * Global signifies that the configuration remains constant for each
     * action execution.
     */

    @Range(min=MIN_TIMEOUT_VALUE,
           max=MAX_TIMEOUT_VALUE,
           message=TIMEOUT_OUT_OF_RANGE_MESSAGE)
    Integer timeoutInMillisecond;
    PaginationType paginationType = PaginationType.NONE;

    // API fields
    String path;
    List<Property> headers;
    Boolean encodeParamsToggle = true;
    List<Property> queryParameters;
    String body;
    // For form-data input instead of json use the following
    List<Property> bodyFormData;
    // For route parameters extracted from rapid-api
    List<Property> routeParameters;
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

    @Transient
    String templateName;

    public void setTimeoutInMillisecond(String timeoutInMillisecond) {
        try {
            this.timeoutInMillisecond = Integer.valueOf(timeoutInMillisecond);
        } catch (NumberFormatException e) {
            System.out.println("Failed to convert timeout request parameter to Integer. Setting it to max valid " +
                    "value.");
            this.timeoutInMillisecond = MAX_TIMEOUT_VALUE;
        }
    }

    public Integer getTimeoutInMillisecond() {
        return (timeoutInMillisecond == null || timeoutInMillisecond <= 0) ?
                DEFAULT_ACTION_EXECUTION_TIMEOUT_MS : timeoutInMillisecond;
    }
}
