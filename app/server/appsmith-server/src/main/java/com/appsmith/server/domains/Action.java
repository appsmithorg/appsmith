package com.appsmith.server.domains;

import com.appsmith.external.models.ActionConfiguration;
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
public class Action extends BaseDomain {

    String name;

    String resourceId;

    String pluginId;

    String pageId;

    String collectionId;

    ActionConfiguration actionConfiguration;

    // This is a list of keys that the client whose values the client needs to send during action execution.
    // These are the Mustache keys that the server will replace before invoking the API
    List<String> jsonPathKeys;
}
