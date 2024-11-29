package com.appsmith.git.dto;

import lombok.Data;

/**
 * TODO: scope for addition in case of native implementation
 */
@Data
public class CommitDTO {

    String message;

    String header;

    Boolean isAmendCommit;

    GitUser author;

    GitUser committer;
}
