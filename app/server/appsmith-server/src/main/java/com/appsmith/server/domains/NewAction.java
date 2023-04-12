package com.appsmith.server.domains;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.BranchAwareDomain;
import com.appsmith.external.models.BranchAwareDomain;
import com.appsmith.external.models.Documentation;
import com.appsmith.external.models.PluginType;
import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonView;
import com.appsmith.external.views.Views;
import com.appsmith.server.constants.ResourceModes;
import com.appsmith.server.interfaces.PublishableResource;
import com.appsmith.server.serializers.ExportSerializer;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonView;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
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
@JsonSerialize(using = ActionSerializer.class)
public class NewAction extends BranchAwareDomain implements PublishableResource {

    // Fields in action that are not allowed to change between published and unpublished versions
    @JsonView(Views.Public.class)
    String applicationId;

    //Organizations migrated to workspaces, kept the field as deprecated to support the old migration
    @Deprecated
    @JsonView(Views.Public.class)
    String organizationId;

    @JsonView(Views.Public.class)
    String workspaceId;

    @JsonView({Views.Public.class, Views.Export.class})
    PluginType pluginType;

    @JsonView({Views.Public.class, Views.Export.class})
    String pluginId;

    @JsonView({Views.Public.class, Views.Export.class})
    String templateId; //If action is created via a template, store the id here.

    @JsonView(Views.Public.class)
    String providerId; //If action is created via a template, store the template's provider id here.

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

    @JsonView(Views.Import.class)
    @JsonProperty("action")
    public void setUnublishedAction(ActionDTO unpublishedAction) {
        this.unpublishedAction = unpublishedAction;
    }

    @Override
    public ActionDTO select(ResourceModes mode) {
        switch(mode) {
            case EDIT: {
                return unpublishedAction;
            }
            case VIEW: {
                return publishedAction;
            }
            default: {
                throw new RuntimeException("Invalid mode");
            }
        }
    }
}

class ActionSerializer extends ExportSerializer<NewAction> {
    public ActionSerializer() {
        super(NewAction.class, "action");
    }
}