package com.appsmith.server.git.templates.contexts;

import lombok.Getter;
import lombok.Setter;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * Holds expectations for auto-commit behavior in Git integration tests.
 * Template providers must populate these expectations based on the application JSON file.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AutoCommitExpectations {
    private String expectedCommitMessagePattern;
    private boolean enabled;
    private String expectedBranchName;
    private boolean shouldTriggerAutoCommit;
    
    /**
     * Expected author identity for auto-commits.
     * This can be used to validate that auto-commits are properly attributed
     * to the system rather than a specific user.
     */
    private String expectedCommitAuthor;
    
    /**
     * Expected timestamp pattern for auto-commits.
     * Can be used to validate that commits occur within expected timeframes
     * relative to the triggering action.
     */
    private String expectedTimestampPattern;
}
