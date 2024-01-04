package com.appsmith.server.events;

import lombok.Data;
import lombok.ToString;

/**
 * This call is the DTO to pass data from main thread to background job.
 * As it's serialized and deserialized, we can only put primitive data types and string types in it.
 */
@Data
@ToString
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
}
