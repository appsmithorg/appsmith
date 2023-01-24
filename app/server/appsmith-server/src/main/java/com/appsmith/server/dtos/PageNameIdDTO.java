package com.appsmith.server.dtos;

import com.appsmith.external.models.Views;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PageNameIdDTO {
    String id;

    String name;

    String slug;

    String customSlug;

    Boolean isDefault;

    Boolean isHidden;

    // This field will represent the default pageId for current page in git system where we are connecting resources
    // among the branches
    @JsonView(Views.Internal.class)
    String defaultPageId;
}
