package com.appsmith.external.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class GitApplicationDTO {
    String organizationId;
    String defaultApplicationId;
    String branchName;
}
