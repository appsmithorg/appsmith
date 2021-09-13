package com.appsmith.server.dtos;

import lombok.Data;


@Data
public class GitCommitDTO {
    private String commitMessage;

    private String commitHeader;

    private Boolean doPush;
}
