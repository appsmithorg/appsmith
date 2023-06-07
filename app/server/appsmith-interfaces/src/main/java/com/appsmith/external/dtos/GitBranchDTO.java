/* Copyright 2019-2023 Appsmith */
package com.appsmith.external.dtos;

import lombok.Data;

@Data
public class GitBranchDTO {
    String branchName;

    boolean isDefault;

    boolean createdFromLocal;
}
