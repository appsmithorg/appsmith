package com.appsmith.server.domains.ce;

import com.appsmith.external.models.BranchAwareDomain;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.views.Git;
import com.appsmith.external.views.Views;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import lombok.experimental.FieldNameConstants;

import static com.appsmith.external.helpers.StringUtils.dotted;

/**
 * This class represents a collection of actions that may or may not belong to the same plugin.
 * The logic for grouping is agnostic of the handling of this collection
 */
@Getter
@Setter
@ToString
@FieldNameConstants
public class ActionCollectionCE extends BranchAwareDomain {
    // Default resources from BranchAwareDomain will be used to store branchName, defaultApplicationId and
    // defaultActionCollectionId
    @JsonView(Views.Public.class)
    String applicationId;

    @JsonView(Views.Public.class)
    String workspaceId;

    @JsonView({Views.Public.class, Git.class})
    ActionCollectionDTO unpublishedCollection;

    @JsonView(Views.Public.class)
    ActionCollectionDTO publishedCollection;

    @JsonView(Views.Public.class)
    CreatorContextType contextType;

    @Override
    public void sanitiseToExportDBObject() {
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

    public static class Fields extends BranchAwareDomain.Fields {
        public static final String publishedCollection_name =
                dotted(publishedCollection, ActionCollectionDTO.Fields.name);
        public static final String unpublishedCollection_name =
                dotted(unpublishedCollection, ActionCollectionDTO.Fields.name);

        public static final String publishedCollection_pageId =
                dotted(publishedCollection, ActionCollectionDTO.Fields.pageId);
        public static final String unpublishedCollection_pageId =
                dotted(unpublishedCollection, ActionCollectionDTO.Fields.pageId);

        public static final String publishedCollection_contextType =
                dotted(publishedCollection, ActionCollectionDTO.Fields.contextType);
        public static final String unpublishedCollection_contextType =
                dotted(unpublishedCollection, ActionCollectionDTO.Fields.contextType);
        public static final String unpublishedCollection_deletedAt =
                dotted(unpublishedCollection, ActionCollectionDTO.Fields.deletedAt);
    }
}
