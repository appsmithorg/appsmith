package com.appsmith.server.helpers;

import com.appsmith.caching.annotations.Cache;
import com.appsmith.caching.annotations.CacheEvict;
import com.appsmith.server.dtos.ApplicationTemplate;
import com.appsmith.server.dtos.CacheableApplicationJson;
import com.appsmith.server.dtos.CacheableApplicationTemplate;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.services.ce.ApplicationTemplateServiceCEImpl;
import com.appsmith.util.WebClientUtils;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponents;
import org.springframework.web.util.UriComponentsBuilder;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;

@AllArgsConstructor
@Component
public class CacheableTemplateHelper {
    @Cache(cacheName = "templateMetadata", key = "{#releaseVersion}")
    public static Mono<CacheableApplicationTemplate> getTemplates(String releaseVersion, String baseUrl) {
        UriComponentsBuilder uriComponentsBuilder =
                UriComponentsBuilder.newInstance().queryParam("version", releaseVersion);

        // uriComponents will build url in format: version=version&id=id1&id=id2&id=id3
        UriComponents uriComponents = uriComponentsBuilder.build();

        return WebClientUtils.create(baseUrl + "/api/v1/app-templates?" + uriComponents.getQuery())
                .get()
                .exchangeToFlux(clientResponse -> {
                    if (clientResponse.statusCode().equals(HttpStatus.OK)) {
                        return clientResponse.bodyToFlux(ApplicationTemplate.class);
                    } else if (clientResponse.statusCode().isError()) {
                        return Flux.error(
                                new AppsmithException(AppsmithError.CLOUD_SERVICES_ERROR, clientResponse.statusCode()));
                    } else {
                        return clientResponse.createException().flatMapMany(Flux::error);
                    }
                })
                .collectList()
                .map(applicationTemplates -> {
                    CacheableApplicationTemplate cacheableApplicationTemplate = new CacheableApplicationTemplate();
                    cacheableApplicationTemplate.setApplicationTemplateList(applicationTemplates);
                    cacheableApplicationTemplate.setLastUpdated(Instant.now());
                    return cacheableApplicationTemplate;
                });
    }

    @Cache(cacheName = "templateApplicationData", key = "{#templateId}")
    public static Mono<CacheableApplicationJson> getApplicationByTemplateId(String templateId, String baseUrl) {
        final String templateUrl = baseUrl + "/api/v1/app-templates/" + templateId + "/application";
        /*
         * using a custom url builder factory because default builder always encodes
         * URL.
         * It's expected that the appDataUrl is already encoded, so we don't need to
         * encode that again.
         * Encoding an encoded URL will not work and end up resulting a 404 error
         */
        final int size = 4 * 1024 * 1024; // 4 MB
        final ExchangeStrategies strategies = ExchangeStrategies.builder()
                .codecs(codecs -> codecs.defaultCodecs().maxInMemorySize(size))
                .build();

        WebClient webClient = WebClientUtils.builder()
                .uriBuilderFactory(new ApplicationTemplateServiceCEImpl.NoEncodingUriBuilderFactory(templateUrl))
                .exchangeStrategies(strategies)
                .build();

        return webClient
                .get()
                .retrieve()
                .bodyToMono(String.class)
                .map(jsonString -> {
                    CacheableApplicationJson cacheableApplicationJson = new CacheableApplicationJson();
                    cacheableApplicationJson.setApplicationJson(jsonString);
                    cacheableApplicationJson.setLastUpdated(Instant.now());
                    return cacheableApplicationJson;
                })
                .switchIfEmpty(
                        Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "template", templateId)));
    }

    @CacheEvict(cacheName = "templateMetadata", key = "{#releaseVersion}")
    public static Mono<Void> clearTemplateMetadataCache(String releaseVersion) {
        return Mono.empty().then();
    }

    @CacheEvict(cacheName = "templateApplicationData", key = "{#templateId}")
    public static Mono<Void> clearTemplateApplicationDataCache(String templateId) {
        return Mono.empty().then();
    }
}
