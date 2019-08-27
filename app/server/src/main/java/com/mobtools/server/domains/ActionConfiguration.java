package com.mobtools.server.domains;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Getter
@Setter
@ToString
@NoArgsConstructor
@Document
public class ActionConfiguration extends BaseDomain {
    /*
     * Any of the fields mentioned below could be represented in mustache
     * template. If the mustache template is found, it would be replaced
     * realtime every time the action needs to be executed. If no {{}} braces
     * are found, that implies the configuration is global for this action.
     * Global signifies that the configuration remains constant for each
     * action execution.
     */

    // API fields
    String resourceEndPoint;
    List<Property> headers;
    List<Property> queryParameters;
    String body;

    // DB action fields
    String query;

    /*
     * Future plugins could require more fields that are not covered above.
     * They will have to represented in a key-value format where the plugin
     * understands what the keys stand for.
     */
    List<Property> pluginSpecifiedTemplates;
}
