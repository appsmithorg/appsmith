package com.appsmith.external.models;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.http.HttpMethod;

import java.util.List;
import java.util.Map;

@Getter
@Setter
@ToString
@NoArgsConstructor
@Document
public class ActionConfiguration {
    /*
     * Any of the fields mentioned below could be represented in mustache
     * template. If the mustache template is found, it would be replaced
     * realtime every time the action needs to be executed. If no {{}} braces
     * are found, that implies the configuration is global for this action.
     * Global signifies that the configuration remains constant for each
     * action execution.
     */

    int timeoutInMillisecond = 10000;

    // API fields
    String path;
    List<Property> headers;
    List<Property> queryParameters;
    String body;
    HttpMethod httpMethod;

    // DB action fields

    /*
     * For SQL plugins, the query field would be of the following format :
     * {
     *     "cmd" : "select * from users;"
     * }
     * For noSQL plugins, the query json would be constructed according to
     * the requirements of the plugin.
     */
    Map<String, Object> query;

    /*
     * Future plugins could require more fields that are not covered above.
     * They will have to represented in a key-value format where the plugin
     * understands what the keys stand for.
     */
    List<Property> pluginSpecifiedTemplates;
}
