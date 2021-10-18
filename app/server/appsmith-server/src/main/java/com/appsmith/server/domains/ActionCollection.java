package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
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
public class ActionCollection extends BaseDomain {

    String applicationId;

    String organizationId;

    ActionCollectionDTO unpublishedCollection;

    ActionCollectionDTO publishedCollection;

    // This will be used to store the defaultApplicationId, defaultCollectionId and branchName for branching model in git sync
    @JsonIgnore
    DefaultResources defaultResources;

    // This field will only be used for git related functionality to sync the collections object across different instances
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    String gitSyncId;
}
