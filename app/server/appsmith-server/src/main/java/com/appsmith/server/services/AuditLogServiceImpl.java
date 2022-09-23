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

import java.time.Instant;
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
            auditLog.setEventName(eventName);
            auditLog.setEventDate(Instant.now());

            setResourceProperties(auditLog, resource);
            //TODO fetch the App and Workspace info from DB or pass it from the respective service class during the analytics event
            if(properties != null && !properties.isEmpty()) {
                setApplicationProperties(auditLog, (Application) properties.get(FieldName.APPLICATION));
                setWorkspaceProperties(auditLog, (Workspace) properties.get(FieldName.WORKSPACE));
            }

            return sessionUserService.getCurrentUser()
                    .flatMap(user -> {
                        AuditLog.UserInfo userInfo = auditLog.getUser();
                        userInfo.setName(user.getUsername());
                        userInfo.setId(user.getId());
                        userInfo.setEmail(user.getEmail());
                        auditLog.setUser(userInfo);
                        return repository.save(auditLog);
                    }); // TODO: Needs to be scheduled in separate thread
        }
    }

     /**
     * @param auditLog AuditLog domain object
     * @param resource Event data from the Analytics service
     * This method will add the event to the resource object
     * Ex: A page was created in the app
     * The resource object of the Audit log will contain
     *      page Id as resource id
     *      type is page
     *      name is resource name
     */
    private void setResourceProperties(AuditLog auditLog, Object resource) {
        AuditLog.Resource resourceData = auditLog.getResource();
        resourceData.setType(AuditLogEvents.resourceMap.get(resource.getClass().getSimpleName()));

        // TODO Use view mode for the action and Page, refactor the code to avoid the if else condition
        if (resource instanceof Workspace) {
            Workspace workspace = (Workspace) resource;
            resourceData.setId(workspace.getId());
            resourceData.setName(workspace.getName());
        }
        else if (resource instanceof Datasource) {
            Datasource datasource = (Datasource) resource;
            resourceData.setId(datasource.getId());
            resourceData.setName(datasource.getName());
        }
        else if (resource instanceof Application) {
            Application application = (Application) resource;
            resourceData.setId(application.getId());
            resourceData.setName(application.getName());
        }
        else if (resource instanceof NewPage) {
            NewPage newPage = (NewPage) resource;
            resourceData.setId(newPage.getId());
            resourceData.setName(newPage.getUnpublishedPage().getName());
        }
        else if (resource instanceof NewAction) {
            NewAction newAction = (NewAction) resource;
            resourceData.setId(newAction.getId());
            resourceData.setName(newAction.getUnpublishedAction().getName());
        }
    }

    /**
     * To set the related data if the resource is Workspace
     * @param auditLog AuditLog
     * @param workspace Workspace
     */
    private void setWorkspaceProperties(AuditLog auditLog, Workspace workspace) {
        AuditLog.WorkspaceInfo workspaceInfo = auditLog.getWorkspace();
        workspaceInfo.setId(workspace.getId());
        workspaceInfo.setName(workspaceInfo.getName());
        auditLog.setWorkspace(workspaceInfo);
    }

    /**
     * To set the related data if the resource is Application
     * @param auditLog AuditLog
     * @param application Datasource
     */
    private void setApplicationProperties(AuditLog auditLog, Application application) {
        AuditLog.ApplicationInfo applicationInfo = auditLog.getApplication();
        applicationInfo.setId(application.getId());
        applicationInfo.setName(application.getName());
        if (application.getGitApplicationMetadata() != null) {
            applicationInfo.getGit().setBranch(application.getGitApplicationMetadata().getBranchName());
            applicationInfo.getGit().setDefaultBranch(application.getGitApplicationMetadata().getDefaultBranchName());
        }
        auditLog.setApplication(applicationInfo);
    }
}
