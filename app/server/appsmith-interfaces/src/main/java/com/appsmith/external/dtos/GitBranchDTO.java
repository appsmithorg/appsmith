package com.appsmith.external.dtos;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class GitBranchDTO {
    String branchName;

    @JsonProperty("default")
    boolean isDefault;

    boolean createdFromLocal;
}
