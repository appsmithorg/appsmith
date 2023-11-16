package com.appsmith.server.dtos;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class BranchProtectionRequestDTO {
    @NotNull private List<String> branchNames;
}
