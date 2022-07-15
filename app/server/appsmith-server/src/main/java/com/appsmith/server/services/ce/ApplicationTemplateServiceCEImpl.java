package com.appsmith.server.services.ce;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.external.converters.GsonISOStringToInstantConverter;
import com.appsmith.server.configurations.CloudServicesConfig;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.ApplicationTemplate;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.UserDataService;
import com.appsmith.server.solutions.ImportExportApplicationService;
import com.appsmith.server.solutions.ReleaseNotesService;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.reflect.TypeToken;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.springframework.util.MultiValueMap;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.DefaultUriBuilderFactory;
import org.springframework.web.util.UriComponents;
import org.springframework.web.util.UriComponentsBuilder;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.lang.reflect.Type;
import java.time.Instant;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ApplicationTemplateServiceCEImpl implements ApplicationTemplateServiceCE {
    private final CloudServicesConfig cloudServicesConfig;
    private final ReleaseNotesService releaseNotesService;
    private final ImportExportApplicationService importExportApplicationService;
    private final AnalyticsService analyticsService;
    private final UserDataService userDataService;

    public ApplicationTemplateServiceCEImpl(CloudServicesConfig cloudServicesConfig,
                                            ReleaseNotesService releaseNotesService,
                                            ImportExportApplicationService importExportApplicationService,
                                            AnalyticsService analyticsService,
                                            UserDataService userDataService) {
        this.cloudServicesConfig = cloudServicesConfig;
        this.releaseNotesService = releaseNotesService;
        this.importExportApplicationService = importExportApplicationService;
        this.analyticsService = analyticsService;
        this.userDataService = userDataService;
    }

    @Override
    public Flux<ApplicationTemplate> getSimilarTemplates(String templateId, MultiValueMap<String, String> params) {
        UriComponents uriComponents = UriComponentsBuilder
                .fromUriString(cloudServicesConfig.getBaseUrl())
                .pathSegment("api/v1/app-templates", templateId, "similar")
                .queryParams(params)
                .queryParam("version", releaseNotesService.getReleasedVersion())
                .build();

        String apiUrl = uriComponents.toUriString();

        return WebClient
                .create(apiUrl)
                .get()
                .exchangeToFlux(clientResponse -> {
                    if (clientResponse.statusCode().equals(HttpStatus.OK)) {
                        return clientResponse.bodyToFlux(ApplicationTemplate.class);
                    } else if (clientResponse.statusCode().isError()) {
                        return Flux.error(new AppsmithException(AppsmithError.CLOUD_SERVICES_ERROR, clientResponse.statusCode()));
                    } else {
                        return clientResponse.createException().flatMapMany(Flux::error);
                    }
                });
    }

    @Override
    public Mono<List<ApplicationTemplate>> getActiveTemplates(List<String> templateIds) {
        final String baseUrl = cloudServicesConfig.getBaseUrl();

        UriComponentsBuilder uriComponentsBuilder = UriComponentsBuilder.newInstance()
                .queryParam("version", releaseNotesService.getReleasedVersion());

        if (!CollectionUtils.isEmpty(templateIds)) {
            uriComponentsBuilder.queryParam("id", templateIds);
        }

        // uriComponents will build url in format: version=version&id=id1&id=id2&id=id3
        UriComponents uriComponents = uriComponentsBuilder.build();

        return WebClient
                .create(baseUrl + "/api/v1/app-templates?" + uriComponents.getQuery())
                .get()
                .exchangeToFlux(clientResponse -> {
                    if (clientResponse.statusCode().equals(HttpStatus.OK)) {
                        return clientResponse.bodyToFlux(ApplicationTemplate.class);
                    } else if (clientResponse.statusCode().isError()) {
                        return Flux.error(new AppsmithException(AppsmithError.CLOUD_SERVICES_ERROR, clientResponse.statusCode()));
                    } else {
                        return clientResponse.createException().flatMapMany(Flux::error);
                    }
                })
                .collectList().zipWith(userDataService.getForCurrentUser())
                .map(objects -> {
                    List<ApplicationTemplate> applicationTemplateList = objects.getT1();
                    UserData userData = objects.getT2();
                    List<String> recentlyUsedTemplateIds = userData.getRecentlyUsedTemplateIds();
                    if (!CollectionUtils.isEmpty(recentlyUsedTemplateIds)) {
                        applicationTemplateList.sort(
                                Comparator.comparingInt(o -> {
                                    int index = recentlyUsedTemplateIds.indexOf(o.getId());
                                    if (index < 0) {
                                        // template not in recent list, return a large value so that it's sorted out to the end
                                        index = Integer.MAX_VALUE;
                                    }
                                    return index;
                                })
                        );
                    }
                    return applicationTemplateList;
                });
    }

    @Override
    public Mono<ApplicationTemplate> getTemplateDetails(String templateId) {
        final String baseUrl = cloudServicesConfig.getBaseUrl();

        return WebClient
                .create(baseUrl + "/api/v1/app-templates/" + templateId)
                .get()
                .exchangeToMono(clientResponse -> {
                    if (clientResponse.statusCode().equals(HttpStatus.OK)) {
                        return clientResponse.bodyToMono(ApplicationTemplate.class);
                    } else if (clientResponse.statusCode().isError()) {
                        return Mono.error(new AppsmithException(AppsmithError.CLOUD_SERVICES_ERROR, clientResponse.statusCode()));
                    } else {
                        return clientResponse.createException().flatMap(Mono::error);
                    }
                });
    }

    private Mono<ApplicationJson> getApplicationJsonFromTemplate(String templateId) {
        final String baseUrl = cloudServicesConfig.getBaseUrl();
        final String templateUrl = baseUrl + "/api/v1/app-templates/" + templateId + "/application";
            /* using a custom url builder factory because default builder always encodes URL.
             It's expected that the appDataUrl is already encoded, so we don't need to encode that again.
             Encoding an encoded URL will not work and end up resulting a 404 error */
        final int size = 4 * 1024 * 1024; // 4 MB
        final ExchangeStrategies strategies = ExchangeStrategies.builder()
                .codecs(codecs -> codecs.defaultCodecs().maxInMemorySize(size))
                .build();

        WebClient webClient = WebClient.builder()
                .uriBuilderFactory(new NoEncodingUriBuilderFactory(templateUrl))
                .exchangeStrategies(strategies)
                .build();

        return webClient
                .get()
                .retrieve()
                .bodyToMono(String.class)
                .map(jsonString -> {
                    Gson gson = new GsonBuilder()
                            .registerTypeAdapter(Instant.class, new GsonISOStringToInstantConverter())
                            .create();
                    Type fileType = new TypeToken<ApplicationJson>() {
                    }.getType();

                    ApplicationJson jsonFile = gson.fromJson(jsonString, fileType);
                    return jsonFile;
                })
                .switchIfEmpty(
                        Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "template", templateId))
                );
    }

    @Override
    public Mono<Application> importApplicationFromTemplate(String templateId, String workspaceId) {
        return getApplicationJsonFromTemplate(templateId).flatMap(applicationJson ->
            importExportApplicationService.importApplicationInWorkspace(workspaceId, applicationJson)
        ).flatMap(application -> {
            ApplicationTemplate applicationTemplate = new ApplicationTemplate();
            applicationTemplate.setId(templateId);
            Map<String, Object>  extraProperties = new HashMap<>();
            extraProperties.put("templateAppName", application.getName());
            return userDataService.addTemplateIdToLastUsedList(templateId).then(
                            analyticsService.sendObjectEvent(AnalyticsEvents.FORK, applicationTemplate, extraProperties)
            ).thenReturn(application);
        });
    }

    @Override
    public Mono<List<ApplicationTemplate>> getRecentlyUsedTemplates() {
        return userDataService.getForCurrentUser().flatMap(userData -> {
            List<String> templateIds = userData.getRecentlyUsedTemplateIds();
            if(!CollectionUtils.isEmpty(templateIds)) {
                return getActiveTemplates(templateIds);
            }
            return Mono.empty();
        });
    }

    @Override
    public Mono<ApplicationTemplate> getFilters() {
        final String baseUrl = cloudServicesConfig.getBaseUrl();

        return WebClient
                .create(baseUrl + "/api/v1/app-templates/filters")
                .get()
                .exchangeToMono(clientResponse -> {
                    if (clientResponse.statusCode().equals(HttpStatus.OK)) {
                        return clientResponse.bodyToMono(ApplicationTemplate.class);
                    } else if (clientResponse.statusCode().isError()) {
                        return Mono.error(new AppsmithException(AppsmithError.CLOUD_SERVICES_ERROR, clientResponse.statusCode()));
                    } else {
                        return clientResponse.createException().flatMap(Mono::error);
                    }
                });
    }

    public static class NoEncodingUriBuilderFactory extends DefaultUriBuilderFactory {
        public NoEncodingUriBuilderFactory(String baseUriTemplate) {
            super(UriComponentsBuilder.fromHttpUrl(baseUriTemplate));
            super.setEncodingMode(EncodingMode.NONE);
        }
    }

    @Override
    public Mono<Application> mergeTemplateWithApplication(String templateId, String applicationId, String organizationId, String branchName, List<String> pagesToImport) {
        return getApplicationJsonFromTemplate(templateId).flatMap(applicationJson ->
                importExportApplicationService.mergeApplicationJsonWithApplication(
                        organizationId, applicationId, null, applicationJson, pagesToImport
                )
        );
    }
}
