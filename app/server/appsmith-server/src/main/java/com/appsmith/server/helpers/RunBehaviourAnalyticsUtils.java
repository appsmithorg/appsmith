package com.appsmith.server.helpers;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.RunBehaviourEnum;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationMode;
import com.appsmith.server.domains.RunBehaviourAnalyticsMetadata;
import com.appsmith.server.enums.RunBehaviourUpdateSource;
import com.appsmith.server.services.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.ObjectUtils;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.Map;

import static java.lang.Boolean.TRUE;

@Component
@RequiredArgsConstructor
public class RunBehaviourAnalyticsUtils {

    private final AnalyticsService analyticsService;
    private final ApplicationService applicationService;

    public Mono<Void> sendRunBehaviourChangedAnalytics(RunBehaviourAnalyticsMetadata params) {
        ActionDTO actionDTO = params.getActionDTO();
        RunBehaviourEnum oldRunBehaviour = params.getOldRunBehaviour();
        CreatorContextType creatorType = params.getCreatorContextType();
        RunBehaviourUpdateSource wasChangedBy = params.getWasChangedBy();
        boolean isActionPartOfModuleInstance = params.isActionPartOfModuleInstance();

        return Mono.justOrEmpty(actionDTO.getApplicationId())
                .flatMap(applicationService::findById)
                .defaultIfEmpty(new Application())
                .flatMap(application -> {
                    Map<String, Object> data = new HashMap<>();
                    data.put("actionId", ObjectUtils.defaultIfNull(actionDTO.getId(), ""));
                    data.put("name", ObjectUtils.defaultIfNull(actionDTO.getName(), ""));
                    data.put("pageId", ObjectUtils.defaultIfNull(actionDTO.getPageId(), ""));
                    data.put("applicationId", ObjectUtils.defaultIfNull(actionDTO.getApplicationId(), ""));
                    data.put("pluginId", ObjectUtils.defaultIfNull(actionDTO.getPluginId(), ""));
                    data.put("pluginName", ObjectUtils.defaultIfNull(actionDTO.getPluginName(), ""));
                    data.put("createdAt", ObjectUtils.defaultIfNull(actionDTO.getCreatedAt(), ""));
                    data.put("oldRunBehaviour", ObjectUtils.defaultIfNull(oldRunBehaviour, ""));
                    data.put("newRunBehaviour", ObjectUtils.defaultIfNull(actionDTO.getRunBehaviour(), ""));
                    data.put("pluginType", ObjectUtils.defaultIfNull(actionDTO.getPluginType(), ""));
                    data.put("actionConfiguration", ObjectUtils.defaultIfNull(actionDTO.getActionConfiguration(), ""));

                    // Handle potential null createdAt for formatting
                    String actionCreated = actionDTO.getCreatedAt() != null
                            ? DateUtils.ISO_FORMATTER.format(actionDTO.getCreatedAt())
                            : "";
                    data.put("actionCreated", actionCreated);

                    final String appMode = TRUE.equals(application.getViewMode())
                            ? ApplicationMode.PUBLISHED.toString()
                            : ApplicationMode.EDIT.toString();

                    data.put("workspaceId", ObjectUtils.defaultIfNull(application.getWorkspaceId(), ""));
                    data.put(FieldName.APP_MODE, appMode);
                    data.put("appName", ObjectUtils.defaultIfNull(application.getName(), ""));
                    data.put("isExampleApp", ObjectUtils.defaultIfNull(application.isAppIsExample(), false));

                    // Handle datasource info with null checks
                    Map<String, Object> datasourceInfo = new HashMap<>();
                    if (actionDTO.getDatasource() != null) {
                        datasourceInfo.put(
                                "name",
                                ObjectUtils.defaultIfNull(
                                        actionDTO.getDatasource().getName(), ""));
                        datasourceInfo.put(
                                "dsIsMock",
                                ObjectUtils.defaultIfNull(
                                        actionDTO.getDatasource().getIsMock(), false));
                        datasourceInfo.put(
                                "dsIsTemplate",
                                ObjectUtils.defaultIfNull(
                                        actionDTO.getDatasource().getIsTemplate(), false));
                        datasourceInfo.put(
                                "dsId",
                                ObjectUtils.defaultIfNull(
                                        actionDTO.getDatasource().getId(), ""));
                    } else {
                        datasourceInfo.put("name", "");
                        datasourceInfo.put("dsIsMock", false);
                        datasourceInfo.put("dsIsTemplate", false);
                        datasourceInfo.put("dsId", "");
                    }
                    data.put("datasource", datasourceInfo);

                    data.put("wasChangedBy", ObjectUtils.defaultIfNull(wasChangedBy, ""));
                    data.put("creatorContextType", ObjectUtils.defaultIfNull(creatorType, CreatorContextType.PAGE));
                    data.put("isActionPartOfModuleInstance", isActionPartOfModuleInstance);

                    return analyticsService
                            .sendObjectEvent(AnalyticsEvents.ACTION_RUN_BEHAVIOUR_CHANGED, actionDTO, data)
                            .then(); // Return Mono<Void> for fire-and-forget
                });
    }
}
