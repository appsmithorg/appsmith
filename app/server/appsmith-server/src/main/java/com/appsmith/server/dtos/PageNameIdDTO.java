package com.appsmith.server.dtos;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PageNameIdDTO {
    String id;

    String name;

    String slug;

    Boolean isDefault;

    Boolean isHidden;

    // This field will represent the default pageId for current page in git system where we are connecting resources
    // among the branches
    @JsonIgnore
    String defaultPageId;
}
