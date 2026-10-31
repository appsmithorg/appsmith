package com.appsmith.server.dtos.ce;

import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldNameConstants;

import java.util.Set;

@FieldNameConstants
@Getter
@Setter
public class PageNameIdDTOCE {
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
    String uniqueSlug;

    @JsonView(Views.Public.class)
    String customSlug;

    @JsonView(Views.Public.class)
    Boolean isDefault;

    @JsonView(Views.Public.class)
    Boolean isHidden;

    @JsonView(Views.Public.class)
    Set<String> userPermissions;

    public static class Fields {}
}
