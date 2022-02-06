package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.dtos.ActionCollectionDTO;
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

    // Default resources from base domain will be used to store branchName, defaultApplicationId and defaultActionCollectionId

    String applicationId;

    String organizationId;

    ActionCollectionDTO unpublishedCollection;

    ActionCollectionDTO publishedCollection;
}
