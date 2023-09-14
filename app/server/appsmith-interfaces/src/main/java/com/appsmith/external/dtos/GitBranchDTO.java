package com.appsmith.external.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class GitBranchDTO {
    String branchName;

    boolean isDefault;

    boolean createdFromLocal;
}
