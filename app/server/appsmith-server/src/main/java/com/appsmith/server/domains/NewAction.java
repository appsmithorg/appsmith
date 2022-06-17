package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.dtos.ActionDTO;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.mongodb.core.mapping.Document;

@Getter
@Setter
@ToString
@NoArgsConstructor
@Document
public class NewAction extends BaseDomain {

    // Fields in action that are not allowed to change between published and unpublished versions
    String applicationId;

    String organizationId;

    PluginType pluginType;

    String pluginId;

    String templateId; //If action is created via a template, store the id here.

    String providerId; //If action is created via a template, store the template's provider id here.

    Documentation documentation; // Documentation for the template using which this action was created

    // Action specific fields that are allowed to change between published and unpublished versions
    ActionDTO unpublishedAction;

    ActionDTO publishedAction;

}
