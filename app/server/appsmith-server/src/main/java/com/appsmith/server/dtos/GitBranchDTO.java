package com.appsmith.server.dtos;

import lombok.Data;

@Data
public class GitBranchDTO {
    String branchName;

    boolean createdFromLocal;
}
