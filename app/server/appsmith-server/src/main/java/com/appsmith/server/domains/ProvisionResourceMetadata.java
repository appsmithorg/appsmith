package com.appsmith.server.domains;

import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

// This class will be used for setting the Metadata for the individual resources, namely User and UserGroup.
// This would be built from the already existing data which exists in the Database for the resources.


// Also needed to add this as an additional resource, even though createdAt and updatedAt exist in the BaseDomain, because those are marked
// as Internal, and hence will not be exposed to the external world.
@AllArgsConstructor
@Builder
@Data
@NoArgsConstructor
public class ProvisionResourceMetadata {
    @JsonView(Views.Public.class)
    private String resourceType;

    @JsonView(Views.Public.class)
    private String created;

    @JsonView(Views.Public.class)
    private String lastModified;
}