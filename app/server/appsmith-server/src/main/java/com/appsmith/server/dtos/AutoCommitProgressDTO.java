package com.appsmith.server.dtos;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;

@Data
@RequiredArgsConstructor
@NoArgsConstructor
public class AutoCommitProgressDTO {
    @NonNull private Boolean isRunning;

    private Integer progress;
    private String branchName;
}
