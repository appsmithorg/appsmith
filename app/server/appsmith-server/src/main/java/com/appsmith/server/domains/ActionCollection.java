package com.appsmith.server.domains;

import com.appsmith.server.constants.ResourceModes;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.interfaces.PublishableResource;
import com.appsmith.server.serializers.ExportSerializer;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonView;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.appsmith.external.models.BranchAwareDomain;
import com.appsmith.external.views.Views;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * This class represents a collection of actions that may or may not belong to the same plugin.
 * The logic for grouping is agnostic of the handling of this collection
 */
@Getter
@Setter
@ToString
@NoArgsConstructor
@Document
@JsonSerialize(using = ActionCollectionSerializer.class)
public class ActionCollection extends BranchAwareDomain implements PublishableResource {

    // Default resources from base domain will be used to store branchName, defaultApplicationId and defaultActionCollectionId

    @JsonView(Views.Public.class)
    String applicationId;

    //Organizations migrated to workspaces, kept the field as depricated to support the old migration
    @Deprecated
    @JsonView(Views.Public.class)
    String organizationId;

    @JsonView(Views.Public.class)
    String workspaceId;

    @JsonView(Views.Public.class)
    ActionCollectionDTO unpublishedCollection;

    @JsonView(Views.Public.class)
    ActionCollectionDTO publishedCollection;

    @JsonView(Views.Import.class)
    @JsonProperty("collection")
    public void setUnpublishedCollection(ActionCollectionDTO unpublishedCollection) {
        this.unpublishedCollection = unpublishedCollection;
    }

    @Override
    public ActionCollectionDTO select(ResourceModes mode) {
        switch (mode) {
            case VIEW:
                return publishedCollection;
            case EDIT:
                return unpublishedCollection;
            default:
                throw new RuntimeException("Invalid mode");
        }
    }
}

class ActionCollectionSerializer extends ExportSerializer<ActionCollection> {

    public ActionCollectionSerializer() {
        super(ActionCollection.class, "collection");
    }
}