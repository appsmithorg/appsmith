package com.appsmith.server.domains;

import com.appsmith.external.models.BranchAwareDomain;
import com.appsmith.external.models.Documentation;
import com.appsmith.external.models.PluginType;
import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonView;
import com.appsmith.external.models.ActionDTO;
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
public class NewAction extends BranchAwareDomain {

    // Fields in action that are not allowed to change between published and unpublished versions
    @JsonView(Views.Public.class)
    String applicationId;

    //Organizations migrated to workspaces, kept the field as deprecated to support the old migration
    @Deprecated
    @JsonView(Views.Public.class)
    String organizationId;

    @JsonView(Views.Public.class)
    String workspaceId;

    @JsonView(Views.Public.class)
    PluginType pluginType;

    @JsonView(Views.Public.class)
    String pluginId;

    @JsonView(Views.Public.class)
    String templateId; //If action is created via a template, store the id here.

    @JsonView(Views.Public.class)
    String providerId; //If action is created via a template, store the template's provider id here.

    @JsonView(Views.Public.class)
    Documentation documentation; // Documentation for the template using which this action was created

    // Action specific fields that are allowed to change between published and unpublished versions
    ActionDTO unpublishedAction;

    ActionDTO publishedAction;

    @JsonView(Views.ExportPublished.class)
    @JsonProperty("action")
    public ActionDTO getPublishedAction() {
        return publishedAction;
    }

    @JsonView(Views.ExportUnpublished.class)
    @JsonProperty("action")
    public ActionDTO getUnpublishedAction() {
        return unpublishedAction;
    }

    @JsonView(Views.Import.class)
    @JsonProperty("action")
    public void setUnublishedAction(ActionDTO unpublishedAction) {
        this.unpublishedAction = unpublishedAction;
    }
}
