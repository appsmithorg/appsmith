package com.appsmith.server.dtos;

import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PageNameIdDTO {
    @JsonView(Views.Public.class)
    String id;

    @JsonView(Views.Public.class)
    String name;

    @JsonView(Views.Public.class)
    String icon;

    @JsonView(Views.Public.class)
    String slug;

    @JsonView(Views.Public.class)
    String customSlug;

    @JsonView(Views.Public.class)
    Boolean isDefault;

    @JsonView(Views.Public.class)
    Boolean isHidden;

    // This field will represent the default pageId for current page in git system where we are connecting resources
    // among the branches
    @JsonView(Views.Internal.class)
    String defaultPageId;
}
