package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.dtos.ActionDTO;
import com.fasterxml.jackson.annotation.JsonProperty;
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

    // This field will only be used for git related functionality to sync the action object across different instances.
    // Once created no-one has access to update this field
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    String gitSyncId;

    // This field will be used to store the default/root actionId for actions generated for git connected applications
    // and will be used to connect actions across the branches
    String defaultActionId;

    String branchName;

}
