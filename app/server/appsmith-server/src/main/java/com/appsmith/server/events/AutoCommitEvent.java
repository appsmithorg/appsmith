package com.appsmith.server.events;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

/**
 * This call is the DTO to pass data from main thread to background job.
 * As it's serialized and deserialized, we can only put primitive data types and string types in it.
 */
@Data
@ToString
@NoArgsConstructor
@AllArgsConstructor
public class AutoCommitEvent {
    private String applicationId;
    private String branchName;
    private String workspaceId;
    private String repoName;
    private String authorName;

    @ToString.Exclude
    private String authorEmail;

    @ToString.Exclude
    private String repoUrl;

    @ToString.Exclude
    private String privateKey;

    @ToString.Exclude
    private String publicKey;

    public AutoCommitEvent(
            String applicationId,
            String branchName,
            String workspaceId,
            String repoName,
            String authorName,
            String authorEmail,
            String repoUrl,
            String privateKey,
            String publicKey) {
        this.applicationId = applicationId;
        this.branchName = branchName;
        this.workspaceId = workspaceId;
        this.repoName = repoName;
        this.authorName = authorName;
        this.authorEmail = authorEmail;
        this.repoUrl = repoUrl;
        this.privateKey = privateKey;
        this.publicKey = publicKey;
    }

    // These flags are required to select what part of changes are required to be merged.
    private Boolean isServerSideEvent;
    private Boolean isClientSideEvent;
}
