package com.appsmith.server.applications.jslibs;

import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.QApplication;
import com.appsmith.server.dtos.CustomJSLibContextDTO;
import com.appsmith.server.jslibs.context.ContextBasedJsLibServiceCE;
import com.mongodb.client.result.UpdateResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.completeFieldName;

@RequiredArgsConstructor
@Service
public class ApplicationJsLibServiceCEImpl implements ContextBasedJsLibServiceCE<Application> {

    protected final ApplicationService applicationService;

    @Override
    public Mono<Set<CustomJSLibContextDTO>> getAllVisibleJSLibContextDTOFromContext(
            String contextId, String branchName, Boolean isViewMode) {
        return applicationService
                .findByIdAndBranchName(
                        contextId,
                        List.of(
                                isViewMode
                                        ? completeFieldName(QApplication.application.publishedCustomJSLibs)
                                        : completeFieldName(QApplication.application.unpublishedCustomJSLibs)),
                        branchName)
                .map(application -> {
                    if (isViewMode) {
                        return application.getPublishedCustomJSLibs() == null
                                ? new HashSet<>()
                                : application.getPublishedCustomJSLibs();
                    }

                    return application.getUnpublishedCustomJSLibs() == null
                            ? new HashSet<>()
                            : application.getUnpublishedCustomJSLibs();
                });
    }

    @Override
    public Mono<UpdateResult> updateJsLibsInContext(
            String contextId, String branchName, Set<CustomJSLibContextDTO> updatedJSLibDTOSet) {
        Map<String, Object> fieldNameValueMap =
                Map.of(completeFieldName(QApplication.application.unpublishedCustomJSLibs), updatedJSLibDTOSet);
        return applicationService.update(contextId, fieldNameValueMap, branchName);
    }
}
