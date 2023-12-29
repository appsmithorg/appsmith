package com.appsmith.server.domains;

import com.appsmith.external.views.Views;
import com.appsmith.server.domains.ce.ActionCollectionCE;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.fasterxml.jackson.annotation.JsonView;
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
public class ActionCollection extends ActionCollectionCE {

    @JsonView(Views.Public.class)
    String moduleInstanceId;

    @JsonView(Views.Public.class)
    Boolean isPublic;

    @JsonView(Views.Public.class)
    String rootModuleInstanceId;

    @JsonView(Views.Public.class)
    String workflowId;

    @JsonView(Views.Internal.class)
    String originActionCollectionId;

    @Override
    public void sanitiseToExportDBObject() {
        super.sanitiseToExportDBObject();

        if (this.rootModuleInstanceId != null) {
            this.setOriginActionCollectionId(null);
            ActionCollectionDTO unpublishedCollection = this.getUnpublishedCollection();
            if (unpublishedCollection != null) {
                unpublishedCollection.setBody(null);
                unpublishedCollection.setVariables(null);
            }
            ActionCollectionDTO publishedCollection = this.getPublishedCollection();
            if (publishedCollection != null) {
                publishedCollection.setBody(null);
                publishedCollection.setVariables(null);
            }
        }
    }
}
