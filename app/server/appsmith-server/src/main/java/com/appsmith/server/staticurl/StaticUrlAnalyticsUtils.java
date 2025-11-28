package com.appsmith.server.staticurl;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.helpers.GitUtils;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.SessionUserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.Map;

import static org.apache.commons.lang3.ObjectUtils.defaultIfNull;

/**
 * Utility class for sending analytics events related to static URL operations.
 *
 * <p>This class provides methods to track user interactions with static URL features
 * including enabling/disabling static URLs, updating application slugs, and updating page slugs.</p>
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class StaticUrlAnalyticsUtils {

    private final SessionUserService sessionUserService;
    private final AnalyticsService analyticsService;

    /**
     * Sends an analytics event for application-level static URL operations.
     *
     * @param event       The analytics event to send
     * @param application The application for which the event is being sent
     * @param uniqueSlug  The unique slug associated with this operation (can be null for disable events)
     * @return Mono&lt;Application&gt; the same application after sending the event
     */
    public Mono<Application> sendApplicationStaticUrlEvent(
            AnalyticsEvents event, Application application, String uniqueSlug) {

        return sessionUserService.getCurrentUser().flatMap(user -> {
            Map<String, Object> analyticsProps = buildApplicationAnalyticsProps(application, uniqueSlug);

            log.debug(
                    "Sending static URL analytics event: {} for applicationId: {}, slug: {}",
                    event.getEventName(),
                    application.getId(),
                    uniqueSlug);

            return analyticsService
                    .sendEvent(event.getEventName(), user.getUsername(), analyticsProps)
                    .thenReturn(application);
        });
    }

    /**
     * Sends an analytics event for page-level static URL operations.
     *
     * @param event         The analytics event to send
     * @param page          The page for which the event is being sent
     * @param applicationId The application ID containing this page
     * @param uniqueSlug    The unique slug associated with this operation
     * @return Mono&lt;NewPage&gt; the same page after sending the event
     */
    public Mono<NewPage> sendPageStaticUrlEvent(
            AnalyticsEvents event, NewPage page, String applicationId, String uniqueSlug) {

        return sessionUserService.getCurrentUser().flatMap(user -> {
            Map<String, Object> analyticsProps = buildPageAnalyticsProps(page, applicationId, uniqueSlug);

            log.debug(
                    "Sending static URL analytics event: {} for pageId: {}, applicationId: {}, slug: {}",
                    event.getEventName(),
                    page.getId(),
                    applicationId,
                    uniqueSlug);

            return analyticsService
                    .sendEvent(event.getEventName(), user.getUsername(), analyticsProps)
                    .thenReturn(page);
        });
    }

    /**
     * Builds analytics properties for application-level static URL events.
     *
     * @param application The application to extract properties from
     * @param uniqueSlug  The unique slug being set/updated
     * @return Map containing analytics properties
     */
    private Map<String, Object> buildApplicationAnalyticsProps(Application application, String uniqueSlug) {
        Map<String, Object> analyticsProps = new HashMap<>();

        // Application identifiers
        analyticsProps.put(FieldName.APPLICATION_ID, defaultIfNull(application.getBaseId(), application.getId()));
        analyticsProps.put("branchedApplicationId", defaultIfNull(application.getId(), ""));
        analyticsProps.put(FieldName.WORKSPACE_ID, defaultIfNull(application.getWorkspaceId(), ""));

        // Slug information
        analyticsProps.put("uniqueSlug", defaultIfNull(uniqueSlug, ""));

        // Git connection status
        boolean isGitConnected = GitUtils.isArtifactConnectedToGit(application.getGitArtifactMetadata());
        analyticsProps.put("isGitConnected", isGitConnected);

        // Application name for context
        analyticsProps.put("applicationName", defaultIfNull(application.getName(), ""));

        return analyticsProps;
    }

    /**
     * Builds analytics properties for page-level static URL events.
     *
     * @param page          The page to extract properties from
     * @param applicationId The application ID containing this page
     * @param uniqueSlug    The unique slug being set/updated
     * @return Map containing analytics properties
     */
    private Map<String, Object> buildPageAnalyticsProps(NewPage page, String applicationId, String uniqueSlug) {
        Map<String, Object> analyticsProps = new HashMap<>();

        // Page identifiers
        analyticsProps.put(FieldName.PAGE_ID, defaultIfNull(page.getBaseId(), page.getId()));
        analyticsProps.put("branchedPageId", defaultIfNull(page.getId(), ""));

        // Application identifier
        analyticsProps.put(FieldName.APPLICATION_ID, defaultIfNull(applicationId, ""));

        // Slug information
        analyticsProps.put("uniqueSlug", defaultIfNull(uniqueSlug, ""));

        // Page name for context
        String pageName = "";
        if (page.getUnpublishedPage() != null && page.getUnpublishedPage().getName() != null) {
            pageName = page.getUnpublishedPage().getName();
        }
        analyticsProps.put("pageName", pageName);

        return analyticsProps;
    }
}
