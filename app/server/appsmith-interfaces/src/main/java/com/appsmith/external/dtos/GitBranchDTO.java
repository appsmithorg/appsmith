package com.appsmith.external.dtos;

import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Data;

@Data
public class GitBranchDTO {
    @JsonView(Views.Public.class)
    String branchName;

    @JsonView(Views.Public.class)
    boolean isDefault;

    @JsonView(Views.Public.class)
    boolean createdFromLocal;
}
