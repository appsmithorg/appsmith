package com.appsmith.server.git.utils;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.ApplicationMode;
import com.appsmith.server.domains.Artifact;
import com.appsmith.server.domains.GitArtifactMetadata;
import com.appsmith.server.domains.User;
import com.appsmith.server.helpers.GitUtils;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.SessionUserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static com.appsmith.external.constants.AnalyticsEvents.GIT_ADD_PROTECTED_BRANCH;
import static com.appsmith.external.constants.AnalyticsEvents.GIT_REMOVE_PROTECTED_BRANCH;
import static org.apache.commons.lang.ObjectUtils.defaultIfNull;

@Slf4j
@Component
@RequiredArgsConstructor
public class GitAnalyticsUtils {

    private final SessionUserService sessionUserService;
    private final AnalyticsService analyticsService;

    public Mono<? extends Artifact> addAnalyticsForGitOperation(
            AnalyticsEvents eventName, Artifact artifact, Boolean isRepoPrivate) {
        return addAnalyticsForGitOperation(eventName, artifact, "", "", isRepoPrivate, false);
    }

    public Mono<? extends Artifact> addAnalyticsForGitOperation(
            AnalyticsEvents eventName, String branchName, Artifact artifact) {
        return addAnalyticsForGitOperation(eventName, artifact, null, null, null, false, null, branchName);
    }

    public Mono<? extends Artifact> addAnalyticsForGitOperation(
            AnalyticsEvents eventName,
            Artifact artifact,
            String errorType,
            String errorMessage,
            Boolean isRepoPrivate) {
        return addAnalyticsForGitOperation(eventName, artifact, errorType, errorMessage, isRepoPrivate, false);
    }

    public Mono<? extends Artifact> addAnalyticsForGitOperation(
            AnalyticsEvents event,
            Artifact artifact,
            String errorType,
            String errorMessage,
            Boolean isRepoPrivate,
            Boolean isSystemGenerated) {
        return addAnalyticsForGitOperation(
                event, artifact, errorType, errorMessage, isRepoPrivate, isSystemGenerated, null);
    }

    public Mono<? extends Artifact> addAnalyticsForGitOperation(
            AnalyticsEvents event,
            Artifact artifact,
            String errorType,
            String errorMessage,
            Boolean isRepoPrivate,
            Boolean isSystemGenerated,
            Boolean isMergeable) {

        String branchName = artifact.getGitArtifactMetadata() != null
                ? artifact.getGitArtifactMetadata().getBranchName()
                : null;
        return addAnalyticsForGitOperation(
                event, artifact, errorType, errorMessage, isRepoPrivate, isSystemGenerated, isMergeable, branchName);
    }

    public Mono<? extends Artifact> addAnalyticsForGitOperation(
            AnalyticsEvents event,
            Artifact artifact,
            String errorType,
            String errorMessage,
            Boolean isRepoPrivate,
            Boolean isSystemGenerated,
            Boolean isMergeable,
            String branchName) {
        GitArtifactMetadata gitData = artifact.getGitArtifactMetadata();
        Map<String, Object> analyticsProps = new HashMap<>();
        if (gitData != null) {
            analyticsProps.put(FieldName.APPLICATION_ID, gitData.getDefaultArtifactId());
            analyticsProps.put("appId", gitData.getDefaultArtifactId());
            analyticsProps.put(FieldName.BRANCH_NAME, branchName);
            analyticsProps.put(FieldName.GIT_HOSTING_PROVIDER, GitUtils.getGitProviderName(gitData.getRemoteUrl()));
            analyticsProps.put(FieldName.REPO_URL, gitData.getRemoteUrl());
            if (event == AnalyticsEvents.GIT_COMMIT) {
                analyticsProps.put("isAutoCommit", false);
            }
        }
        // Do not include the error data points in the map for success states
        if (StringUtils.hasText(errorMessage) || StringUtils.hasText(errorType)) {
            analyticsProps.put("errorMessage", errorMessage);
            analyticsProps.put("errorType", errorType);
        }

        // Do not include the isMergeable for all the events
        if (isMergeable != null) {
            analyticsProps.put(FieldName.IS_MERGEABLE, isMergeable);
        }
        analyticsProps.putAll(Map.of(
                FieldName.ORGANIZATION_ID,
                defaultIfNull(artifact.getWorkspaceId(), ""),
                "orgId",
                defaultIfNull(artifact.getWorkspaceId(), ""),
                "branchApplicationId",
                defaultIfNull(artifact.getId(), ""),
                "isRepoPrivate",
                defaultIfNull(isRepoPrivate, ""),
                "isSystemGenerated",
                defaultIfNull(isSystemGenerated, "")));
        final Map<String, Object> eventData =
                Map.of(FieldName.APP_MODE, ApplicationMode.EDIT.toString(), FieldName.APPLICATION, artifact);
        analyticsProps.put(FieldName.EVENT_DATA, eventData);
        return sessionUserService.getCurrentUser().flatMap(user -> analyticsService
                .sendEvent(event.getEventName(), user.getUsername(), analyticsProps)
                .thenReturn(artifact));
    }

    public Mono<Void> sendUnitExecutionTimeAnalyticsEvent(
            String flowName, Long elapsedTime, User currentUser, Artifact artifact) {
        GitArtifactMetadata gitArtifactMetadata = artifact.getGitArtifactMetadata();

        final Map<String, Object> data = Map.of(
                FieldName.FLOW_NAME,
                flowName,
                FieldName.APPLICATION_ID,
                gitArtifactMetadata.getDefaultArtifactId(),
                "appId",
                gitArtifactMetadata.getDefaultArtifactId(),
                FieldName.BRANCH_NAME,
                gitArtifactMetadata.getBranchName(),
                "organizationId",
                artifact.getWorkspaceId(),
                "repoUrl",
                gitArtifactMetadata.getRemoteUrl(),
                "executionTime",
                elapsedTime);
        return analyticsService.sendEvent(
                AnalyticsEvents.UNIT_EXECUTION_TIME.getEventName(), currentUser.getUsername(), data);
    }

    /**
     * Sends one or more analytics events when there's a change in protected branches.
     * If n number of branches are un-protected and m number of branches are protected, it'll send m+n number of
     * events. It receives the list of branches before and after the action.
     * For example, if user has "main" and "develop" branches as protected and wants to include "staging" branch as
     * protected as well, then oldProtectedBranches will be ["main", "develop"] and newProtectedBranches will be
     * ["main", "develop", "staging"]
     *
     * @param artifact          Application object of the root artifact
     * @param oldProtectedBranches List of branches that were protected before this action.
     * @param newProtectedBranches List of branches that are going to be protected.
     * @return An empty Mono
     */
    public Mono<Void> sendBranchProtectionAnalytics(
            Artifact artifact, List<String> oldProtectedBranches, List<String> newProtectedBranches) {
        List<String> itemsAdded = new ArrayList<>(newProtectedBranches); // add all new items
        itemsAdded.removeAll(oldProtectedBranches); // remove the items that were present earlier

        List<String> itemsRemoved = new ArrayList<>(oldProtectedBranches); // add all old items
        itemsRemoved.removeAll(newProtectedBranches); // remove the items that are also present in new list

        List<Mono<? extends Artifact>> eventSenderMonos = new ArrayList<>();

        // send an analytics event for each removed branch
        for (String branchName : itemsRemoved) {
            eventSenderMonos.add(addAnalyticsForGitOperation(GIT_REMOVE_PROTECTED_BRANCH, branchName, artifact));
        }

        // send an analytics event for each newly protected branch
        for (String branchName : itemsAdded) {
            eventSenderMonos.add(addAnalyticsForGitOperation(GIT_ADD_PROTECTED_BRANCH, branchName, artifact));
        }

        return Flux.merge(eventSenderMonos).then();
    }
}
