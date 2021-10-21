package com.appsmith.server.dtos;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PageNameIdDTO {
    String id;

    String name;

    Boolean isDefault;

    Boolean isHidden;

    // This field will represent the root pageId in git system where we are connecting resources among the branches
    @JsonIgnore
    String gitDefaultPageId;
}
