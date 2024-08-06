package com.appsmith.server.dtos;

import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.Getter;
import lombok.Setter;

import java.util.Set;

@Getter
@Setter
public class PageNameIdDTO {
    @JsonView(Views.Public.class)
    String id;

    @JsonView(Views.Public.class)
    String baseId;

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

    @JsonView(Views.Public.class)
    Set<String> userPermissions;
}
