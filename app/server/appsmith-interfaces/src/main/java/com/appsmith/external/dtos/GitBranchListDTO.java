package com.appsmith.external.dtos;

import com.appsmith.external.models.Views;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class GitBranchListDTO {

    @JsonView(Views.Public.class)
    String branchName;

    @JsonView(Views.Public.class)
    boolean isDefault;
}
