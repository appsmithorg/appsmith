package com.appsmith.server.services.ce;

import com.appsmith.server.domains.Application;
import com.appsmith.server.dtos.ApplicationImportDTO;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.ApplicationTemplate;
import com.appsmith.server.dtos.TemplateDTO;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

public interface ApplicationTemplateServiceCE {

    Mono<List<ApplicationTemplate>> getActiveTemplates(List<String> templateIds);

    Flux<ApplicationTemplate> getSimilarTemplates(String templateId, MultiValueMap<String, String> params);

    Mono<ApplicationTemplate> getTemplateDetails(String templateId);

    Mono<ApplicationImportDTO> importApplicationFromTemplate(String templateId, String workspaceId);

    Mono<ApplicationImportDTO> mergeTemplateWithApplication(
            String templateId, String branchedApplicationId, String workspaceId, List<String> pagesToImport);

    Mono<ApplicationTemplate> getFilters();

    Mono<Application> publishAsCommunityTemplate(TemplateDTO resource);

    Mono<Boolean> publishAppsmithTemplate(TemplateDTO resource);

    Mono<ApplicationJson> getApplicationJsonFromTemplate(String templateId);
}
