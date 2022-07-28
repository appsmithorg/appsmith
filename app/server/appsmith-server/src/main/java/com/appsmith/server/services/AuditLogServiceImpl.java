package com.appsmith.server.services;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.external.models.Datasource;
import com.appsmith.server.constants.AuditLogEvents;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.AuditLog;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.repositories.AuditLogRepository;
import com.appsmith.server.solutions.ReleaseNotesService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditLogServiceImpl implements AuditLogService {

    /**
     * Temporarily using configuration value to control logging.
     * This will help us continuously ship code without affecting production instances.
     * TODO: Remove this once the feature is fully ready to ship.
     */
    @Value("${appsmith.auditlog.enabled:false}")
    private boolean isAuditLogEnabled;
    private final AuditLogRepository repository;
    private final SessionUserService sessionUserService;
    private final ReleaseNotesService releaseNotesService;

    /**
     * To return all the Audit Logs
     * @return List of Audit Logs
     */
    public Mono<List<AuditLog>> get() {
        return repository.findAll().collectList();
    }

    /**
     * To log the Analytic Event as an Audit Log
     * @param event AnalyticEvent that is being fired
     * @param resource The resource to which event is happening as an Object
     * @param properties Extra properties related to event
     * @return Logged event as an Audit Log
     */
    public Mono<AuditLog> logEvent(AnalyticsEvents event, Object resource, Map<String, Object> properties) {
        String resourceClassName = resource.getClass().getSimpleName();
        boolean isLogEvent = isAuditLogEnabled && AuditLogEvents.eventMap.containsKey(event.getEventName()) && AuditLogEvents.resourceMap.containsKey(resourceClassName);
        AuditLog auditLog = new AuditLog();

        if (!isLogEvent) {
            return Mono.just(auditLog);
        }
        else {
            String resourceName = AuditLogEvents.resourceMap.get(resourceClassName);
            String actionName = AuditLogEvents.eventMap.get(event.getEventName());
            String eventName =  resourceName + FieldName.AUDIT_LOG_EVENT_DELIMITER + actionName;

            auditLog.setName(eventName);
            setMetadata(auditLog, properties);

            if (resource instanceof Workspace) {
                setWorkspaceProperties(auditLog, (Workspace) resource);
            }
            else if (resource instanceof Datasource) {
                setDatasourceProperties(auditLog, (Datasource) resource);
            }
            else if (resource instanceof Application) {
                setApplicationProperties(auditLog, (Application) resource);
            }
            else if (resource instanceof NewPage) {
                setNewPageProperties(auditLog, (NewPage) resource);
            }
            else if (resource instanceof NewAction) {
                setNewActionProperties(auditLog, (NewAction) resource);
            }

            return sessionUserService.getCurrentUser()
                    .flatMap(user -> {
                        auditLog.setUserId(user.getUsername());

                        return repository.save(auditLog);
                    }); // TODO: Needs to be scheduled in separate thread
        }
    }

    /**
     * To set metadata from extraProperties and from other sources in the future
     * @param auditLog AuditLog
     * @param extraProperties Extra properties related to event
     */
    private void setMetadata(AuditLog auditLog, Map<String, Object> extraProperties) {
        Map<String, Object> metadata = new HashMap<>();
        metadata.put(FieldName.APPSMITH_VERSION, releaseNotesService.getReleasedVersion());
        if (extraProperties != null) {
            metadata.putAll(extraProperties);
        }
        auditLog.setMetadata(metadata);
    }

    /**
     * To set the related data if the resource is Workspace
     * @param auditLog AuditLog
     * @param workspace Workspace
     */
    private void setWorkspaceProperties(AuditLog auditLog, Workspace workspace) {
        auditLog.setWorkspaceId(workspace.getId());
    }

    /**
     * To set the related data if the resource is Datasource
     * @param auditLog AuditLog
     * @param datasource Datasource
     */
    private void setDatasourceProperties(AuditLog auditLog, Datasource datasource) {
        auditLog.setWorkspaceId(datasource.getWorkspaceId());
        auditLog.setDatasourceId(datasource.getId());
    }

    /**
     * To set the related data if the resource is Application
     * @param auditLog AuditLog
     * @param application Datasource
     */
    private void setApplicationProperties(AuditLog auditLog, Application application) {
        auditLog.setWorkspaceId(application.getWorkspaceId());
        auditLog.setAppId(application.getId());
        auditLog.setAppName(application.getName());
    }

    /**
     * To set the related data if the resource is NewPage
     * @param auditLog AuditLog
     * @param newPage NewPage
     */
    private void setNewPageProperties(AuditLog auditLog, NewPage newPage) {
        auditLog.setAppId(newPage.getApplicationId());
        auditLog.setPageId(newPage.getId());
    }

    /**
     * To set the related data if the resource is NewAction
     * @param auditLog AuditLog
     * @param newAction NewAction
     */
    private void setNewActionProperties(AuditLog auditLog, NewAction newAction) {
        auditLog.setWorkspaceId(newAction.getWorkspaceId());
        auditLog.setAppId(newAction.getApplicationId());
        auditLog.setNewActionId(newAction.getId());
    }
}
