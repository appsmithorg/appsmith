package com.appsmith.server.applications.jslibs;

import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.QApplication;
import com.appsmith.server.dtos.CustomJSLibContextDTO;
import com.appsmith.server.jslibs.context.ContextBasedJsLibService;
import com.mongodb.client.result.UpdateResult;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.completeFieldName;

@Service
public class ApplicationJsLibServiceImpl extends ApplicationJsLibServiceCEImpl
        implements ContextBasedJsLibService<Application> {
    public ApplicationJsLibServiceImpl(ApplicationService applicationService) {
        super(applicationService);
    }

    @Override
    public Mono<Set<CustomJSLibContextDTO>> getAllHiddenJSLibContextDTOFromContext(
            String contextId, String branchName, Boolean isViewMode) {
        return applicationService
                .findByIdAndBranchName(
                        contextId,
                        List.of(
                                isViewMode
                                        ? completeFieldName(
                                                QApplication.application.publishedApplicationDetail.hiddenJSLibs)
                                        : completeFieldName(
                                                QApplication.application.unpublishedApplicationDetail.hiddenJSLibs)),
                        branchName)
                .map(application -> {
                    if (isViewMode) {
                        return application.getPublishedApplicationDetail() == null
                                        || application
                                                        .getPublishedApplicationDetail()
                                                        .getHiddenJSLibs()
                                                == null
                                ? new HashSet<>()
                                : application.getPublishedApplicationDetail().getHiddenJSLibs();
                    }

                    return application.getUnpublishedApplicationDetail() == null
                                    || application
                                                    .getUnpublishedApplicationDetail()
                                                    .getHiddenJSLibs()
                                            == null
                            ? new HashSet<>()
                            : application.getUnpublishedApplicationDetail().getHiddenJSLibs();
                });
    }

    @Override
    public Mono<UpdateResult> updateHiddenJsLibsInContext(
            String contextId, String branchName, Set<CustomJSLibContextDTO> updatedJSLibDTOSet) {
        Map<String, Object> fieldNameValueMap = Map.of(
                completeFieldName(QApplication.application.unpublishedApplicationDetail.hiddenJSLibs),
                updatedJSLibDTOSet);
        return applicationService.update(contextId, fieldNameValueMap, branchName);
    }
}
