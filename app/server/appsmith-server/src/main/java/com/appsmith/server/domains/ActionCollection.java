package com.appsmith.server.domains;

import com.appsmith.external.models.BranchAwareDomain;
import com.appsmith.external.views.Views;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.fasterxml.jackson.annotation.JsonView;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

/**
 * This class represents a collection of actions that may or may not belong to the same plugin.
 * The logic for grouping is agnostic of the handling of this collection
 */
@Getter
@Setter
@ToString
@NoArgsConstructor
@Entity
public class ActionCollection extends BranchAwareDomain {
    // Default resources from BranchAwareDomain will be used to store branchName, defaultApplicationId and
    // defaultActionCollectionId
    @JsonView(Views.Public.class)
    String applicationId;

    @JsonView(Views.Public.class)
    String workspaceId;

    @JsonView(Views.Public.class)
    ActionCollectionDTO unpublishedCollection;

    @JsonView(Views.Public.class)
    ActionCollectionDTO publishedCollection;

    @Override
    public void sanitiseToExportDBObject() {
        this.setDefaultResources(null);
        ActionCollectionDTO unpublishedCollection = this.getUnpublishedCollection();
        if (unpublishedCollection != null) {
            unpublishedCollection.sanitiseForExport();
        }
        ActionCollectionDTO publishedCollection = this.getPublishedCollection();
        if (publishedCollection != null) {
            publishedCollection.sanitiseForExport();
        }
        super.sanitiseToExportDBObject();
    }
}
