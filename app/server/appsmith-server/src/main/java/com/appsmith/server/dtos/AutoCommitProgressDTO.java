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

    // using primitive type int instead of Integer because we want to 0 as default value. Integer have default null
    private int progress;
    private String branchName;
}
