package com.appsmith.server.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;

@Data
@AllArgsConstructor
@RequiredArgsConstructor
public class AutoCommitResponseDTO {

    public enum AutoCommitResponse {
        /**
         * This enum is used when an autocommit is in progress for a different branch from the branch on which
         * the autocommit is requested.
         */
        LOCKED,

        /**
         * This enum is used when an autocommit has been published.
         */
        PUBLISHED,
        /**
         * This enum is used when an autocommit is in progress for the branch from which
         * the autocommit is requested.
         */
        IN_PROGRESS,

        /**
         * This enum is used when an autocommit has been requested however it did not fulfil the pre-requisite.
         */
        REQUIRED,

        /**
         * This enum is used when an autocommit is requested however it's not required.
         */
        IDLE,

        /**
         * This enum is used when the app on which the autocommit is requested is a non git app.
         */
        NON_GIT_APP
    }

    /**
     * Enum to denote the current state of autocommit
     */
    private AutoCommitResponse autoCommitResponse;

    /**
     * progress of the already-running auto-commit.
     */
    private int progress;

    private String branchName;

    public AutoCommitResponseDTO(AutoCommitResponse autoCommitResponse) {
        this.autoCommitResponse = autoCommitResponse;
    }
}
