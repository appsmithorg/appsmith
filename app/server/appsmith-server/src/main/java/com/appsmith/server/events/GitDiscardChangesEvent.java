package com.appsmith.server.events;

import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.domains.User;
import com.appsmith.server.git.central.GitType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.time.Instant;

/**
 * DTO to pass discard changes data from the request flow to a background job.
 */
@Data
@ToString
@NoArgsConstructor
@AllArgsConstructor
public class GitDiscardChangesEvent {

    private String artifactId;
    private ArtifactType artifactType;
    private GitType gitType;
    private Boolean isValidateAndPublish;
    private String authorName;

    @ToString.Exclude
    private String authorEmail;

    @ToString.Exclude
    private User user;

    private Instant expectedUpdatedAt;
}
