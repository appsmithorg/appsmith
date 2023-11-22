package com.appsmith.server.domains.ce;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.BranchAwareDomain;
import com.appsmith.external.models.Documentation;
import com.appsmith.external.models.PluginType;
import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
public class NewActionCE extends BranchAwareDomain {

    // Fields in action that are not allowed to change between published and unpublished versions
    @JsonView(Views.Public.class)
    String applicationId;

    // Organizations migrated to workspaces, kept the field as deprecated to support the old migration
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
    String templateId; // If action is created via a template, store the id here.

    @JsonView(Views.Public.class)
    String providerId; // If action is created via a template, store the template's provider id here.

    @JsonView(Views.Public.class)
    Documentation documentation; // Documentation for the template using which this action was created

    // Action specific fields that are allowed to change between published and unpublished versions
    @JsonView(Views.Public.class)
    ActionDTO unpublishedAction;

    @JsonView(Views.Public.class)
    ActionDTO publishedAction;

    @Override
    public void sanitiseToExportDBObject() {
        this.setTemplateId(null);
        this.setApplicationId(null);
        this.setOrganizationId(null);
        this.setWorkspaceId(null);
        this.setProviderId(null);
        this.setDocumentation(null);
        ActionDTO unpublishedAction = this.getUnpublishedAction();
        if (unpublishedAction != null) {
            unpublishedAction.sanitiseToExportDBObject();
        }
        ActionDTO publishedAction = this.getPublishedAction();
        if (publishedAction != null) {
            publishedAction.sanitiseToExportDBObject();
        }
        super.sanitiseToExportDBObject();
    }
}
