package com.appsmith.server.domains.ce;

import com.appsmith.external.models.BranchAwareDomain;
import com.appsmith.external.views.Views;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.fasterxml.jackson.annotation.JsonView;
import com.vladmihalcea.hibernate.type.json.JsonBinaryType;
import jakarta.persistence.Column;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import org.hibernate.annotations.Type;

/**
 * This class represents a collection of actions that may or may not belong to the same plugin.
 * The logic for grouping is agnostic of the handling of this collection
 */
@Getter
@Setter
@ToString
@MappedSuperclass
public class ActionCollectionCE extends BranchAwareDomain {
    // Default resources from BranchAwareDomain will be used to store branchName, defaultApplicationId and
    // defaultActionCollectionId

    @ManyToOne
    @JoinColumn(name = "application_id", referencedColumnName = "id")
    Application application;

    @JsonView(Views.Public.class)
    @Column(name = "application_id", insertable = false, updatable = false)
    String applicationId;

    @ManyToOne
    @JoinColumn(name = "workspace_id", referencedColumnName = "id")
    Workspace workspace;

    @JsonView(Views.Public.class)
    @Column(name = "workspace_id", insertable = false, updatable = false)
    String workspaceId;

    @JsonView(Views.Public.class)
    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb")
    ActionCollectionDTO unpublishedCollection;

    @JsonView(Views.Public.class)
    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb")
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
