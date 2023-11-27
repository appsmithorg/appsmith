package com.appsmith.server.dtos;

import lombok.Data;

@Data
public class AutoCommitProgressDTO {
    private boolean isRunning;
    private int progress;
    private String branchName;
}
