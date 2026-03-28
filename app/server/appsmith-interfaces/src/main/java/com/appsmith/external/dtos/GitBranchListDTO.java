package com.appsmith.external.dtos;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class GitBranchListDTO {

    String branchName;

    @JsonProperty("default")
    boolean isDefault;
}
