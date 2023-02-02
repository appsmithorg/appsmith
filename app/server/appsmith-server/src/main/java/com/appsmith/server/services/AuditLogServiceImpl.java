package com.appsmith.server.services;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.constants.AuditLogConstants;
import com.appsmith.server.constants.AuditLogEvents;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.AuditLog;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.AuditLogApplicationMetadata;
import com.appsmith.server.domains.ApplicationMode;
import com.appsmith.server.domains.AuditLogGacEntityMetadata;
import com.appsmith.server.domains.AuditLogGacMetadata;
import com.appsmith.server.domains.AuditLogGitMetadata;
import com.appsmith.server.domains.AuditLogPageMetadata;
import com.appsmith.server.domains.AuditLogPermissionGroupMetadata;
import com.appsmith.server.domains.AuditLogResource;
import com.appsmith.server.domains.AuditLogUserGroupMetadata;
import com.appsmith.server.domains.AuditLogUserMetadata;
import com.appsmith.server.domains.AuditLogWorkpsaceMetadata;
import com.appsmith.server.domains.AuditLogDestinationWorkspaceMetadata;
import com.appsmith.server.domains.AuditLogAuthenticationMetadata;
import com.appsmith.server.domains.AuditLogMetadata;
import com.appsmith.server.domains.GacEntityMetadata;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.UserGroup;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.dtos.AuditLogExportDTO;
import com.appsmith.server.dtos.AuditLogFilterDTO;
import com.appsmith.server.dtos.ExportFileDTO;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.AuditLogRepository;
import com.appsmith.server.repositories.NewPageRepository;
import com.appsmith.server.repositories.TenantRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.repositories.WorkspaceRepository;
import com.appsmith.server.repositories.ConfigRepository;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.solutions.ReleaseNotesService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang.StringUtils;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.HashMap;
import java.util.stream.Collectors;

import static com.appsmith.server.acl.AclPermission.READ_APPLICATIONS;
import static com.appsmith.server.constants.FieldName.PERMISSION_GROUP_ID;
import static com.appsmith.server.constants.FieldName.PUBLIC_PERMISSION_GROUP;
import static org.apache.commons.lang.WordUtils.capitalize;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditLogServiceImpl implements AuditLogService {

    private final AuditLogRepository repository;
    private final WorkspaceRepository workspaceRepository;
    private final ApplicationRepository applicationRepository;
    private final NewPageRepository pageRepository;
    private final SessionUserService sessionUserService;
    private final ReleaseNotesService releaseNotesService;
    private final UserRepository userRepository;
    private final PolicyGenerator policyGenerator;
    private final TenantRepository tenantRepository;
    private final ConfigRepository configRepository;
    private final PluginRepository pluginRepository;
    private final CommonConfig commonConfig;

    private static int RECORD_LIMIT = 200;
    private static int EXPORT_RECORD_LIMIT = 5000;
    public static String DELIMITER = ",";
    public static String LOG_EVENT_ERROR = "Error while saving the Audit Logs";
    public static String FILTER_LOG_ERROR = "Error while fetching the Audit Logs";
    public static int UPDATE_TIME_LIMIT_SECS = 300;
    public static String FILE_NAME_PREFIX = "audit-logs";
    public static String JSON_FILE_EXTENSION = ".json";
    public static List<String> autoUpdateEventResources = List.of(
            FieldName.PAGE,
            FieldName.QUERY
    );

    /**
     * To return all the Audit Logs
     * @return List of Audit Logs
     */
    public Mono<List<AuditLog>> getAuditLogs(MultiValueMap<String, String> params) {
	    return getAuditLogRecords(params, RECORD_LIMIT);
    }

    private Mono<List<AuditLog>> getAuditLogRecords(MultiValueMap<String, String> params, int recordLimits) {
        boolean isDate = false;
        List<String> events = new ArrayList<>();
        List<String> emails = new ArrayList<>();
        String resourceType = null;
        String resourceId = null;
        int sortOrder = 0;
        String cursor = null;
        Date startDate = new Date();
        Date endDate = new Date();

        //TODO remove the support for number of days, it should always be date range
        if (params.getFirst(AuditLogConstants.NUMBER_OF_DAYS) != null && Integer.parseInt(params.getFirst(AuditLogConstants.NUMBER_OF_DAYS)) != 0) {
            isDate = true;
            int numberOfDays = Integer.parseInt(params.getFirst(AuditLogConstants.NUMBER_OF_DAYS));
            long time = LocalDate.now().atStartOfDay().minusDays(numberOfDays - 1).toInstant(ZoneOffset.UTC).toEpochMilli();
            startDate = new Date(time);
            endDate = new Date(Instant.now().toEpochMilli());
        } else if (params.getFirst(AuditLogConstants.START_DATE) != null && params.getFirst(AuditLogConstants.END_DATE) != null) {
            isDate = true;
            startDate = new Date(Long.parseLong(params.getFirst(AuditLogConstants.START_DATE)));
            endDate = new Date(Long.parseLong(params.getFirst(AuditLogConstants.END_DATE)));
        }

        if (params.getFirst(AuditLogConstants.EVENTS) != null) {
            events = Arrays.asList(params.getFirst(AuditLogConstants.EVENTS).split(DELIMITER));
        }

        if (params.getFirst(AuditLogConstants.EMAILS) != null) {
            emails = Arrays.asList(params.getFirst(AuditLogConstants.EMAILS).split(DELIMITER));
        }

        if (params.getFirst(AuditLogConstants.RESOURCE_TYPE) != null) {
            resourceType = params.getFirst(AuditLogConstants.RESOURCE_TYPE);
        }

        if (params.getFirst(AuditLogConstants.RESOURCE_ID) != null) {
            resourceId = params.getFirst(AuditLogConstants.RESOURCE_ID);
        }

        if (params.getFirst(AuditLogConstants.SORT_ORDER) != null) {
            sortOrder = Integer.parseInt(params.getFirst(AuditLogConstants.SORT_ORDER));
        }

        if (params.getFirst(AuditLogConstants.CURSOR) != null) {
            cursor = params.getFirst(AuditLogConstants.CURSOR);
        }

        return repository.getAuditLog(
                isDate,
                startDate,
                endDate,
                events,
                emails,
                resourceType,
                resourceId,
                sortOrder,
                cursor,
                recordLimits,
                AclPermission.READ_AUDIT_LOGS).collectList()
            .onErrorResume(throwable -> {
                log.error(FILTER_LOG_ERROR, throwable.getMessage());
                return Mono.empty();
            });
    }

    /**
     * To log the Analytic Event as an Audit Log
     * @param event AnalyticEvent that is being fired
     * @param resource The resource to which event is happening as an Object
     * @param properties Extra properties related to event
     * @return Logged event as an Audit Log
     */
    public Mono<AuditLog> logEvent(AnalyticsEvents event, Object resource, Map<String, Object> properties) {
        // Layout updates on page are considered as page.updated
        if(AnalyticsEvents.UPDATE_LAYOUT.equals(event)) {
            event = AnalyticsEvents.UPDATE;
        }
        boolean isInstanceSettingEvent = AnalyticsEvents.AUTHENTICATION_METHOD_CONFIGURATION.equals(event) || AnalyticsEvents.INSTANCE_SETTING_UPDATED.equals(event) ;
        String resourceClassName = isInstanceSettingEvent ? AnalyticsEvents.AUTHENTICATION_METHOD_CONFIGURATION.getEventName() : resource.getClass().getSimpleName();
        boolean isLogEvent = !commonConfig.isCloudHosting() && AuditLogEvents.eventMap.containsKey(event.getEventName()) && AuditLogEvents.resourceMap.containsKey(resourceClassName);
        AuditLog auditLog = new AuditLog();

        if (!isLogEvent) {
            return Mono.just(auditLog);
        }

        // Map of enums to replace the current implementation
        String resourceName = AuditLogEvents.resourceMap.get(resourceClassName);
        String actionName = AuditLogEvents.eventMap.get(event.getEventName());
        String eventName = resourceName + FieldName.AUDIT_LOG_EVENT_DELIMITER + actionName;
        auditLog.setEvent(eventName);
        auditLog.setTimestamp(Instant.now());
        auditLog.setOrigin(FieldName.AUDIT_LOGS_ORIGIN_SERVER);
        if (null != properties && properties.containsKey(FieldName.AUDIT_LOGS_ORIGIN)) {
            auditLog.setOrigin((String) properties.get(FieldName.AUDIT_LOGS_ORIGIN));
        }

        Mono<User> currentUserMono = sessionUserService.getCurrentUser();

        // Auto generated workspace event during signup does not have sessionUser
        // User details is only available in workspace created by email
        Boolean isWorkspaceCreatedEvent = AnalyticsEvents.CREATE.equals(event) && resource instanceof Workspace;
        if (isWorkspaceCreatedEvent) {
            Workspace workspace = (Workspace) resource;
            if(Boolean.TRUE.equals(workspace.getIsAutoGeneratedWorkspace())) {
                currentUserMono = userRepository.findByEmail(workspace.getEmail());
            }
        }

        // When the event is LOGOUT the user details will not be available in the session
        if(AnalyticsEvents.LOGOUT.equals(event)) {
            User currentUser = (User) resource;
            // For forced session logouts user details will not be available in the session
            // These events are not logged
            if (currentUser.isAnonymous()) {
                return Mono.just(auditLog);
            }
            currentUserMono = Mono.just(currentUser);
        }

        return setProperties(auditLog, event, resource, properties)
                .then(currentUserMono).zipWith(getAuditLogPolicies())
                .map(tuple -> {
                    User user = tuple.getT1();
                    auditLog.setPolicies(tuple.getT2());
                    AuditLogUserMetadata auditLogUserMetadata = new AuditLogUserMetadata();
                    auditLogUserMetadata.setName(user.getName());
                    auditLogUserMetadata.setId(user.getId());
                    auditLogUserMetadata.setEmail(user.getEmail());
                    auditLog.setUser(auditLogUserMetadata);
                    return auditLog;
                })
                .flatMap(auditLog1 -> {
                    /*
                    Update events for Page, Actions are not logged as a new event instead the latest entry is updated with the time.
                    Because of the auto save there would be too many entries in AuditLog collection with updated events.
                    The latest event of the same type is updated given that it is the same user who is performing these actions
                    */
                    if (isUpdatedEvent(resourceName, actionName)) {
                        return repository.updateAuditLogByEventNameUserAndTimeStamp(
                                eventName,
                                auditLog1.getUser().getEmail(),
                                auditLog1.getResource().getId(),
                                Instant.now().toEpochMilli(),
                                auditLog1.getResource().getName(),
                                UPDATE_TIME_LIMIT_SECS
                        ).flatMap(matchCounters -> {
                            if (matchCounters > 0) {
                                return Mono.just(auditLog1);
                            }
                            return repository.save(auditLog1);
                        });
                    }
                    return repository.save(auditLog1);
                }) // TODO: Needs to be scheduled in separate thread
                .onErrorResume(throwable -> {
                    log.error(LOG_EVENT_ERROR, throwable.getMessage());
                    return Mono.empty();
                });

    }

    @Override
    public Mono<AuditLogFilterDTO> getAuditLogFilterData() {
        AuditLogFilterDTO auditLogFilterDTO = new AuditLogFilterDTO();
        List<String> eventList = new ArrayList<>();
        for(AuditLogEvents.Events eventName : AuditLogEvents.Events.values()) {
            eventList.add(getAuditLogEventName(eventName));
        }
        eventList = eventList.stream().sorted().collect(Collectors.toList());
        auditLogFilterDTO.setEventName(eventList);
        Mono<List<String>> userEmail = tenantRepository.findBySlug(FieldName.DEFAULT)
                .flatMap(tenant -> userRepository.getAllUserEmail(tenant.getId()).collectList());
        return userEmail.map(emailList -> {
           auditLogFilterDTO.setEmails(emailList);
           return auditLogFilterDTO;
        });
    }

    /**
     * Provides all audit logs for given params in a JSON file
     * @param params - map of properties to filter on audit logs
     * @return ExportFileDTO which contains JSON file as response
     */
    @Override
    public Mono<ExportFileDTO> exportAuditLogs(MultiValueMap<String, String> params) {
        return this.getAuditLogRecords(params, EXPORT_RECORD_LIMIT).map(
            records -> {
                records.forEach(BaseDomain::sanitiseToExportBaseObject);

                AuditLogExportDTO exportContent = new AuditLogExportDTO(records, params);

                HttpHeaders responseHeaders = new HttpHeaders();
                ContentDisposition contentDisposition = ContentDisposition
                    .builder("attachment")
                    .filename(generateFileName(), StandardCharsets.UTF_8)
                    .build();
                responseHeaders.setContentDisposition(contentDisposition);
                responseHeaders.setContentType(MediaType.APPLICATION_JSON);

                ExportFileDTO exportFileDTO = new ExportFileDTO();
                exportFileDTO.setApplicationResource(exportContent);
                exportFileDTO.setHttpHeaders(responseHeaders);
                return exportFileDTO;
            }
        );
    }

    private String generateFileName() {
        SimpleDateFormat formatter = new SimpleDateFormat("yyyy-MM-dd_HH-mm-ss");
        Date date = new Date();
        return FILE_NAME_PREFIX + "--" + formatter.format(date) + JSON_FILE_EXTENSION;
    }

	@Override
    public Mono<List<String>> getAllUsers() {
        return tenantRepository.findBySlug(FieldName.DEFAULT)
                .flatMap(tenant -> userRepository.getAllUserEmail(tenant.getId()).collectList());
    }

    /**
     * To get user displayable event name from AuditLogEvents.Events
     *
     * @param eventName AuditLogEvents.Events
     * @return displayable event name
     */
    public String getAuditLogEventName(AuditLogEvents.Events eventName) {
        String eventNameLower = eventName.name().toLowerCase();
        if (eventName.name().equals(AuditLogEvents.Events.INSTANCE_SETTING_UPDATED.name())) {
            // Special handling for instance_setting.updated event since it has two "_"
            String temporarySeparator = "#";
            eventNameLower = eventNameLower.replaceFirst(FieldName.AUDIT_LOG_FILTER_EVENT_DELIMITER, temporarySeparator);
            eventNameLower = eventNameLower.replaceFirst(FieldName.AUDIT_LOG_FILTER_EVENT_DELIMITER, FieldName.AUDIT_LOG_EVENT_DELIMITER);
            eventNameLower = eventNameLower.replaceFirst(temporarySeparator, FieldName.AUDIT_LOG_FILTER_EVENT_DELIMITER);

        }
        else {
            eventNameLower = eventNameLower.replaceFirst(FieldName.AUDIT_LOG_FILTER_EVENT_DELIMITER, FieldName.AUDIT_LOG_EVENT_DELIMITER);
        }

        return eventNameLower;
    }

     /**
     * @param auditLog AuditLog domain object
     * @param event Corresponding AnalyticEvent
     * @param resource Event data from the Analytics service
     * @param properties Extra properties from analytic event
     * This method will add the event to the resource object
     * Ex: A page was created in the app
     * The resource object of the Audit log will contain
     *      page Id as resource id
     *      type is page
     *      name is resource name
     */
    private Mono<AuditLog> setProperties(AuditLog auditLog, AnalyticsEvents event, Object resource, Map<String, Object> properties) {
        AuditLogResource auditLogResource = new AuditLogResource();
        auditLogResource.setType(getResourceType(resource));

        AuditLogMetadata auditLogMetadata = new AuditLogMetadata();
        auditLogMetadata.setAppsmithVersion(releaseNotesService.getReleasedVersion());
        auditLog.setMetadata(auditLogMetadata);

        Map<String, Object> eventData = new HashMap<>();
        if (properties != null && properties.containsKey(FieldName.EVENT_DATA) && properties.get(FieldName.EVENT_DATA) != null) {
            eventData.putAll((Map) properties.get(FieldName.EVENT_DATA));
            if (properties.containsKey(FieldName.INVITED_USERS)) {
                eventData.put(FieldName.INVITED_USERS, properties.get(FieldName.INVITED_USERS));
            }
        }

        if (AnalyticsEvents.EXECUTE_INVITE_USERS.equals(event)) {
            setUserInvitedProperties(auditLog, eventData);
        }

        Mono<AuditLog> auditLogMono = Mono.just(auditLog);
        if (resource instanceof Workspace) {
            auditLogMono = setResourceProperties((Workspace) resource, auditLog, auditLogResource);
        }
        else if (resource instanceof Datasource) {
            auditLogMono = setResourceProperties((Datasource) resource, auditLog, auditLogResource, properties);
        }
        else if (resource instanceof Application) {
            auditLogMono = setResourceProperties((Application) resource, auditLog, auditLogResource, properties, event);
        }
        else if (resource instanceof NewPage) {
            auditLogMono = setResourceProperties((NewPage) resource, auditLog, auditLogResource, properties);
        }
        else if (resource instanceof NewAction) {
            auditLogMono = setResourceProperties((NewAction) resource, auditLog, auditLogResource, properties, event, eventData);
        }
        else if (resource instanceof UserGroup) {
            auditLogMono = setResourceProperties((UserGroup) resource, auditLog, auditLogResource, properties);
        }
        else if (resource instanceof PermissionGroup) {
            auditLogMono = setResourceProperties((PermissionGroup) resource, auditLog, auditLogResource, properties);
        } else if (resource instanceof User && event.equals(AnalyticsEvents.DELETE)) {
            auditLogMono = setResourceProperties((User) resource, auditLog, auditLogResource);
        }

        // Instance setting events
        boolean isInstanceSettingUpdated = AnalyticsEvents.INSTANCE_SETTING_UPDATED.equals(event)
                && properties.containsKey(FieldName.UPDATED_INSTANCE_SETTINGS);
        if (isInstanceSettingUpdated) {
            setUpdatedInstanceSettings(auditLog, (Set) properties.get(FieldName.UPDATED_INSTANCE_SETTINGS));
            auditLogMono = Mono.just(auditLog);
        }
        // Authentication method configuration
        boolean isAuthenticationMethodConfigured = AnalyticsEvents.AUTHENTICATION_METHOD_CONFIGURATION.equals(event)
                && properties.containsKey(FieldName.PROVIDER)
                && properties.containsKey(FieldName.ACTION);
        if (isAuthenticationMethodConfigured) {
            setAuthentication(auditLog, properties.get(FieldName.ACTION).toString(), properties.get(FieldName.PROVIDER).toString());
            auditLogMono = Mono.just(auditLog);
        }

        return auditLogMono;
    }

    /**
     * To set resourceProperties for the resource User
     * @param user User
     * @param auditLog AuditLog
     * @param auditLogResource AuditLogResource
     * @return Mono of AuditLog
     */
    private Mono<AuditLog> setResourceProperties(User user, AuditLog auditLog, AuditLogResource auditLogResource) {
        auditLogResource.setId(user.getId());
        auditLogResource.setName(user.getUsername());
        auditLog.setResource(auditLogResource);

        return Mono.just(auditLog);
    }

    /**
     * To set resourceProperties for the resource Workspace
     * @param workspace Workspace
     * @param auditLog AuditLog
     * @param auditLogResource AuditLogResource
     * @return Mono of AuditLog
     */
    private Mono<AuditLog> setResourceProperties(Workspace workspace, AuditLog auditLog, AuditLogResource auditLogResource) {
        auditLogResource.setId(workspace.getId());
        auditLogResource.setName(workspace.getName());
        auditLog.setResource(auditLogResource);

        return Mono.just(auditLog);
    }

    /**
     * To set resourceProperties for the resource Datasource
     * @param datasource Datasource
     * @param auditLog AuditLog
     * @param auditLogResource AuditLogResource
     * @return Mono of AuditLog
     */
    private Mono<AuditLog> setResourceProperties(Datasource datasource, AuditLog auditLog, AuditLogResource auditLogResource, Map<String, Object> properties) {
        auditLogResource.setId(datasource.getId());
        auditLogResource.setName(datasource.getName());
        // Plugin name is required as DatasourceType in Audit Logs
        // Plugin name is fetched from DB since delete events does not have pluginName set by default
        if(!Optional.ofNullable(datasource.getPluginId()).isEmpty()) {
            final Mono<Plugin> setResourceWithPluginNameMono = pluginRepository.findById(datasource.getPluginId())
                    .flatMap(plugin -> {
                        auditLogResource.setDatasourceType(plugin.getName());
                        auditLog.setResource(auditLogResource);
                        return Mono.just(plugin);
                    });
            return setResourceWithPluginNameMono
                    .then(setWorkspace(auditLog, datasource.getWorkspaceId(), properties))
                    .thenReturn(auditLog);
        }

        return Mono.just(auditLog);
    }

    /**
     * To set resourceProperties for the resource Application
     * @param application Application
     * @param auditLog AuditLog
     * @param auditLogResource AuditLogResource
     * @return Mono of AuditLog
     */
    private Mono<AuditLog> setResourceProperties(Application application, AuditLog auditLog, AuditLogResource auditLogResource, Map<String, Object> properties, AnalyticsEvents event) {
        auditLogResource.setId(application.getId());
        auditLogResource.setName(application.getName());
        // Application related event require visibility of application to be logged
        Mono<String> publicPermissionGroupIdMono = getPublicPermissionGroupId();
        Mono<AuditLogResource> setResourceWithVisibilityMono = publicPermissionGroupIdMono
                .flatMap(publicPermissionGroupId -> {
                    boolean isApplicationPublic = isEntityAccessible(application, READ_APPLICATIONS.getValue(), publicPermissionGroupId);
                    auditLogResource.setVisibility(isApplicationPublic ? FieldName.PUBLIC : FieldName.PRIVATE);
                    auditLog.setResource(auditLogResource);
                    return Mono.just(auditLogResource);
                });
        // Special handling for application.forked event to incorporate source and destination workspaces
        if (AnalyticsEvents.FORK.equals(event)) {
            return setResourceWithVisibilityMono
                    .then(setApplication(auditLog, application.getClonedFromApplicationId(), new HashMap<>()))
                    .flatMap(application1 -> {
                        String sourceWorkspaceId = application1.getWorkspaceId();
                        auditLog.setApplication(null);
                        return setWorkspace(auditLog, application.getWorkspaceId(), sourceWorkspaceId, properties);
                    })
                    .thenReturn(auditLog);
        }
        else {
            return setResourceWithVisibilityMono
                    .then(setWorkspace(auditLog, application.getWorkspaceId(), properties))
                    .thenReturn(auditLog);
        }
    }

    /**
     * To set resourceProperties for the resource NewPage
     * @param newPage NewPage
     * @param auditLog AuditLog
     * @param auditLogResource AuditLogResource
     * @return Mono of AuditLog
     */
    private Mono<AuditLog> setResourceProperties(NewPage newPage, AuditLog auditLog, AuditLogResource auditLogResource, Map<String, Object> properties) {
        auditLogResource.setId(newPage.getId());
        auditLogResource.setName(newPage.getUnpublishedPage().getName());
        auditLog.setResource(auditLogResource);

        return setApplication(auditLog, newPage.getApplicationId(), properties)
                .flatMap(application -> setWorkspace(auditLog, application.getWorkspaceId(), properties))
                .thenReturn(auditLog);
    }

    /**
     * To set resourceProperties for the resource NewAction
     * @param newAction NewAction
     * @param auditLog AuditLog
     * @param auditLogResource AuditLogResource
     * @param properties Analytics Properties
     * @param event AnalyticsEvent
     * @param eventData Event Data
     * @return Mono of AuditLog
     */
    private Mono<AuditLog> setResourceProperties(NewAction newAction, AuditLog auditLog, AuditLogResource auditLogResource, Map<String, Object> properties, AnalyticsEvents event, Map<String, Object> eventData) {
        auditLogResource.setId(newAction.getId());
        auditLogResource.setName(newAction.getUnpublishedAction().getName());

        // Execution details for query.executed events
        if (AnalyticsEvents.EXECUTE_ACTION.equals(event) && properties != null) {
            if (properties.containsKey(FieldName.IS_SUCCESSFUL_EXECUTION)) {
                auditLogResource.setExecutionStatus((Boolean) properties.get(FieldName.IS_SUCCESSFUL_EXECUTION) ? FieldName.SUCCESS : FieldName.FAILED);
            }
            if (properties.containsKey(FieldName.STATUS_CODE)) {
                auditLogResource.setResponseCode(properties.get(FieldName.STATUS_CODE).toString());
            }
            if (properties.containsKey(FieldName.TIME_ELAPSED)) {
                auditLogResource.setResponseTime((Long) properties.get(FieldName.TIME_ELAPSED));
            }
            if (eventData.containsKey(FieldName.ACTION_EXECUTION_REQUEST_PARAMS)) {
                List<String> executionParams = (List<String>) eventData.get(FieldName.ACTION_EXECUTION_REQUEST_PARAMS);
                auditLogResource.setExecutionParams((String) executionParams.stream().collect(Collectors.joining(",", "[", "]")));
            }
        }
        auditLog.setResource(auditLogResource);

        return setPage(auditLog, newAction.getUnpublishedAction().getPageId(), properties)
                .flatMap(newPage -> setApplication(auditLog, newAction.getApplicationId(), properties))
                .flatMap(application -> setWorkspace(auditLog, application.getWorkspaceId(), properties))
                .thenReturn(auditLog);
    }

    /**
     * To set resourceProperties for the resource UserGroup
     * @param userGroup UserGroup
     * @param auditLog AuditLog
     * @param auditLogResource AuditLogResource
     * @return Mono of AuditLog
     */
    private Mono<AuditLog> setResourceProperties(UserGroup userGroup, AuditLog auditLog, AuditLogResource auditLogResource, Map<String, Object> properties) {
        auditLogResource.setId(userGroup.getId());
        auditLogResource.setName(userGroup.getName());
        auditLog.setResource(auditLogResource);

        if (null != properties) {
            AuditLogUserGroupMetadata userGroupMetadata = new AuditLogUserGroupMetadata();
            if (properties.containsKey(FieldName.INVITED_USERS_TO_USER_GROUPS)) {
                userGroupMetadata.setInvitedUsers((Set) properties.get(FieldName.INVITED_USERS_TO_USER_GROUPS));
            } else if (properties.containsKey(FieldName.REMOVED_USERS_FROM_USER_GROUPS)) {
                userGroupMetadata.setRemovedUsers((Set) properties.get(FieldName.REMOVED_USERS_FROM_USER_GROUPS));
            }
            auditLog.setGroup(userGroupMetadata);
        }

        return Mono.just(auditLog);
    }

    /**
     * To set resourceProperties for the resource PermissionGroup
     * @param permissionGroup PermissionGroup
     * @param auditLog AuditLog
     * @param auditLogResource AuditLogResource
     * @return Mono of AuditLog
     */
    private Mono<AuditLog> setResourceProperties(PermissionGroup permissionGroup, AuditLog auditLog, AuditLogResource auditLogResource, Map<String, Object> properties) {
        auditLogResource.setId(permissionGroup.getId());
        auditLogResource.setName(permissionGroup.getName());
        auditLog.setResource(auditLogResource);
        if (null != properties) {
            AuditLogPermissionGroupMetadata permissionGroupMetadata = new AuditLogPermissionGroupMetadata();
            if (properties.containsKey(FieldName.ASSIGNED_USERS_TO_PERMISSION_GROUPS))
                permissionGroupMetadata.setAssignedUsers((List) properties.get(FieldName.ASSIGNED_USERS_TO_PERMISSION_GROUPS));
            if (properties.containsKey(FieldName.UNASSIGNED_USERS_FROM_PERMISSION_GROUPS))
                permissionGroupMetadata.setUnassignedUsers((List) properties.get(FieldName.UNASSIGNED_USERS_FROM_PERMISSION_GROUPS));
            if (properties.containsKey(FieldName.ASSIGNED_USER_GROUPS_TO_PERMISSION_GROUPS))
                permissionGroupMetadata.setAssignedGroups((List) properties.get(FieldName.ASSIGNED_USER_GROUPS_TO_PERMISSION_GROUPS));
            if (properties.containsKey(FieldName.UNASSIGNED_USER_GROUPS_FROM_PERMISSION_GROUPS))
                permissionGroupMetadata.setUnassignedGroups((List) properties.get(FieldName.UNASSIGNED_USER_GROUPS_FROM_PERMISSION_GROUPS));
            auditLog.setRole(permissionGroupMetadata);

            if (properties.containsKey(FieldName.GAC_TAB) && properties.containsKey(FieldName.ENTITY_UPDATED_PERMISSIONS)) {
                AuditLogGacMetadata auditLogGacMetadata = new AuditLogGacMetadata();
                auditLogGacMetadata.setTabUpdated((String) properties.get(FieldName.GAC_TAB));
                List<GacEntityMetadata> entityMetadataList = (List<GacEntityMetadata>) properties.get(FieldName.ENTITY_UPDATED_PERMISSIONS);
                List<AuditLogGacEntityMetadata> auditLogGacEntityMetadataList = new ArrayList<>();
                entityMetadataList.forEach(entityMetadata -> {
                    AuditLogGacEntityMetadata auditLogGacEntityMetadata = new AuditLogGacEntityMetadata();
                    auditLogGacEntityMetadata.setId(entityMetadata.getId());
                    auditLogGacEntityMetadata.setName(entityMetadata.getName());
                    auditLogGacEntityMetadata.setType(entityMetadata.getType());
                    auditLogGacEntityMetadata.setPermissions(entityMetadata.getPermissions());
                    auditLogGacEntityMetadataList.add(auditLogGacEntityMetadata);
                });
                auditLogGacMetadata.setEntityMetadata(auditLogGacEntityMetadataList);
                auditLog.setGacMetadata(auditLogGacMetadata);
            }
        }

        return Mono.just(auditLog);
    }

    /**
     * To set the names of updated admin settings for instance_setting.updated events
     * @param auditLog auditLog
     * @param updatedInstanceSettings names of env variables changed in the admin setting update
     */
    private void setUpdatedInstanceSettings(AuditLog auditLog, Set<String> updatedInstanceSettings) {
        auditLog.setInstanceSettings(updatedInstanceSettings);
    }

    /**
     * To set authentication for Authentication method added/removed events
     * @param auditLog auditLog
     * @param authAction the auth action - added/removed
     * @param provider provider of the authentication method
     */
    private void setAuthentication(AuditLog auditLog, String authAction, String provider) {
        AuditLogAuthenticationMetadata auditLogAuthenticationMetadata = new AuditLogAuthenticationMetadata();
        auditLogAuthenticationMetadata.setMode(AuditLogEvents.authenticationMethodsMap.get(provider));
        auditLogAuthenticationMetadata.setAction(authAction);
        auditLog.setAuthentication(auditLogAuthenticationMetadata);
    }

    /**
     * To set properties for user invited events
     * @param auditLog auditLog
     * @param eventData eventData from analytics event
     */
    private void setUserInvitedProperties(AuditLog auditLog, Map<String, Object> eventData) {
        if (eventData.containsKey(FieldName.INVITED_USERS)) {
            auditLog.setInvitedUsers((ArrayList<String>) eventData.get(FieldName.INVITED_USERS));
        }
        if (eventData.containsKey(FieldName.WORKSPACE)) {
            setWorkspaceProperties(auditLog, (Workspace) eventData.get(FieldName.WORKSPACE));
        }
    }

    /**
     * To generate Audit Log supported resourceType
     * @param resource
     * @return String resource type name
     */
    public String getResourceType(Object resource) {
        // To handle special exceptions in resources class names like NewPage => Page, NewAction => Query
        List<String> exceptionResources = List.of(
                NewPage.class.getSimpleName(),
                NewAction.class.getSimpleName(),
                PermissionGroup.class.getSimpleName(),
                UserGroup.class.getSimpleName()
        );
        String resourceClassName = resource.getClass().getSimpleName();
        if (exceptionResources.contains(resourceClassName)) {
            return capitalize(AuditLogEvents.resourceMap.get(resource.getClass().getSimpleName()));
        }

        return resourceClassName;
    }

    /**
     * To set Workspace to AuditLog
     * @param auditLog AuditLog
     * @param workspaceId ID of workspace the event belongs to
     * @param properties Extra properties
     * @return Workspace
     */
    private Mono<Workspace> setWorkspace(AuditLog auditLog, String workspaceId, Map<String, Object> properties) {
        if (properties != null && properties.containsKey(FieldName.WORKSPACE)) {
            Workspace workspace = (Workspace) properties.get(FieldName.WORKSPACE);
            setWorkspaceProperties(auditLog, workspace);
            return Mono.just(workspace);
        }
        if(workspaceId == null) {
            return Mono.empty();
        }

        return workspaceRepository.findById(workspaceId)
                .map(workspace -> {
                    setWorkspaceProperties(auditLog, workspace);
                    return workspace;
                });
    }

    /**
     * To set Workspace to AuditLog for application.forked events
     * @param auditLog AuditLog
     * @param workspaceId ID of workspace to which the application is forked
     * @param sourceWorkspaceId ID of workspace from which the application was forked
     * @param properties Extra properties
     * @return Workspace
     */
    private Mono<Workspace> setWorkspace(AuditLog auditLog, String workspaceId, String sourceWorkspaceId, Map<String, Object> properties) {
        return workspaceRepository.findById(sourceWorkspaceId)
                .flatMap(workspace -> {
                    setWorkspaceProperties(auditLog, workspace);
                    return workspaceRepository.findById(workspaceId);
                })
                .map(workspace -> {

                    AuditLogDestinationWorkspaceMetadata destinationWorkspaceMetadata = new AuditLogDestinationWorkspaceMetadata();
                    destinationWorkspaceMetadata.setId(workspace.getId());
                    destinationWorkspaceMetadata.setName(workspace.getName());
                    auditLog.getWorkspace().setDestination(destinationWorkspaceMetadata);
                    return workspace;
                });
    }

    /**
     * To set Application to AuditLog
     * @param auditLog AuditLog
     * @param applicationId ID of application the event belongs to
     * @param properties Extra properties
     * @return Application
     */
    private Mono<Application> setApplication(AuditLog auditLog, String applicationId, Map<String, Object> properties) {
        Mono<Application> applicationMono = applicationRepository.findById(applicationId);
        if (properties != null && properties.containsKey(FieldName.APPLICATION)) {
            Application application = (Application) properties.get(FieldName.APPLICATION);
            applicationMono = Mono.just(application);
        }
        Mono<String> publicPermissionGroupIdMono = getPublicPermissionGroupId();
        return applicationMono
                .zipWith(publicPermissionGroupIdMono)
                .flatMap(tuple -> {
                    Application application = tuple.getT1();
                    String publicPermissionGroupId = tuple.getT2();
                    boolean isApplicationPublic = isEntityAccessible(application, READ_APPLICATIONS.getValue(), publicPermissionGroupId);

                    // By default, appMode is set to edit mode since this data will be coming via properties for view mode events
                    String appMode = AuditLogEvents.appModeMap.get(ApplicationMode.EDIT.toString());
                    Boolean isAppViewModePresent = false;
                    Map<String, String> eventData = new HashMap<>();
                    Boolean isEventDataPresent = properties != null && properties.containsKey(FieldName.EVENT_DATA) && properties.get(FieldName.EVENT_DATA) != null;
                    if (isEventDataPresent) {
                        eventData = (Map) properties.get(FieldName.EVENT_DATA);
                        isAppViewModePresent =  eventData.containsKey(FieldName.APP_MODE) && eventData.get(FieldName.APP_MODE) != null;
                    }
                    if (isEventDataPresent && isAppViewModePresent) {
                        appMode = AuditLogEvents.appModeMap.get((String) eventData.get(FieldName.APP_MODE));
                    }

                    setApplicationProperties(auditLog, application, isApplicationPublic, appMode);
                    return Mono.just(application);
                });
    }

    /**
     * To set Page to AuditLog
     * @param auditLog AuditLog
     * @param pageId ID of page the event belongs to
     * @param properties Extra properties
     * @return NewPage
     */
    private Mono<NewPage> setPage(AuditLog auditLog, String pageId, Map<String, Object> properties) {
        if (properties != null && properties.containsKey(FieldName.PAGE)) {
            NewPage newPage = (NewPage) properties.get(FieldName.PAGE);
            setPageProperties(auditLog, newPage);
            return Mono.just(newPage);
        }
        return pageRepository.findById(pageId)
                .map( newPage -> {
                    setPageProperties(auditLog, newPage);
                    return newPage;
                });
    }

    /**
     * To set Workspace properties to AuditLog
     * @param auditLog AuditLog
     * @param workspace Workspace
     */
    private void setWorkspaceProperties(AuditLog auditLog, Workspace workspace) {
        AuditLogWorkpsaceMetadata auditLogWorkpsaceMetadata = new AuditLogWorkpsaceMetadata();
        auditLogWorkpsaceMetadata.setId(workspace.getId());
        auditLogWorkpsaceMetadata.setName(workspace.getName());
        auditLog.setWorkspace(auditLogWorkpsaceMetadata);
    }

    /**
     * To set Application properties to AuditLog
     * @param auditLog AuditLog
     * @param application Application
     * @param isApplicationPublic Application is public or not
     * @param appMode Application is opened in view mode or edit mode
     */
    private void setApplicationProperties(AuditLog auditLog, Application application, Boolean isApplicationPublic, String appMode) {
        AuditLogApplicationMetadata applicationMetadata = new AuditLogApplicationMetadata();
        applicationMetadata.setId(application.getId());
        applicationMetadata.setName(application.getName());
        applicationMetadata.setMode(appMode);
        applicationMetadata.setVisibility(isApplicationPublic ? FieldName.PUBLIC : FieldName.PRIVATE);
        if (application.getGitApplicationMetadata() != null && !StringUtils.isEmpty(application.getGitApplicationMetadata().getBranchName())) {
            AuditLogGitMetadata auditLogGitMetadata = new AuditLogGitMetadata();
            auditLogGitMetadata.setBranch(application.getGitApplicationMetadata().getBranchName());
            if(!StringUtils.isEmpty(application.getGitApplicationMetadata().getRemoteUrl())) {
                auditLogGitMetadata.setRepoURL(application.getGitApplicationMetadata().getRemoteUrl());
            }
            if(application.getGitApplicationMetadata().getIsRepoPrivate() != null) {
                auditLogGitMetadata.setRepoType(application.getGitApplicationMetadata().getIsRepoPrivate() ? FieldName.PRIVATE : FieldName.PUBLIC);
            }
            applicationMetadata.setGit(auditLogGitMetadata);
        }
        auditLog.setApplication(applicationMetadata);
    }

    /**
     * To set Page properties to AuditLog
     * @param auditLog AuditLog
     * @param newPage NewPage
     */
    private void setPageProperties(AuditLog auditLog, NewPage newPage) {
        AuditLogPageMetadata auditLogPageMetadata = new AuditLogPageMetadata();
        auditLogPageMetadata.setId(newPage.getId());
        // TODO: use view mode to get the name
        auditLogPageMetadata.setName(newPage.getUnpublishedPage().getName());
        auditLog.setPage(auditLogPageMetadata);
    }

    private Mono<Set<Policy>> getAuditLogPolicies() {
        return tenantRepository.findBySlug(FieldName.DEFAULT)
                .map(tenant -> {
                    Set<Policy> documentPolicies = policyGenerator.getAllChildPolicies(tenant.getPolicies(), Tenant.class, AuditLog.class);
                    return documentPolicies;
                });
    }

    /**
     * To get public permission group id
     * Duplicating method since permissionGroupService.getPublicPermissionGroupId() is creating circular dependency error
     * @return
     */
    private Mono<String> getPublicPermissionGroupId() {
        return configRepository.findByName(PUBLIC_PERMISSION_GROUP)
                .map(configObj -> configObj.getConfig().getAsString(PERMISSION_GROUP_ID));
    }

    /**
     * To get if entity is accessible for the given permission and permission group
     * Duplicating method since permissionGroupService.isEntityAccessible() is creating circular dependency error
     * @param object BaseDomain
     * @param permission
     * @param permissionGroupId
     * @return
     */
    private boolean isEntityAccessible(BaseDomain object, String permission, String permissionGroupId) {
        return object.getPolicies()
                .stream()
                .filter(policy -> policy.getPermission().equals(permission) &&
                        policy.getPermissionGroups().contains(permissionGroupId))
                .findFirst()
                .isPresent();
    }

    private boolean isUpdatedEvent(String resource, String event) {
        return FieldName.UPDATED.equals(event) && autoUpdateEventResources.contains(resource);
    }
}