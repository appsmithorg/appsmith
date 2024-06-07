package com.appsmith.server.helpers;

import com.appsmith.external.converters.ISOStringToInstantConverter;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.ApplicationTemplate;
import com.appsmith.server.dtos.CacheableApplicationJson;
import com.appsmith.server.dtos.CacheableApplicationTemplate;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.services.ce.ApplicationTemplateServiceCEImpl;
import com.appsmith.util.WebClientUtils;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.reflect.TypeToken;
import lombok.extern.slf4j.Slf4j;
import org.jetbrains.annotations.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponents;
import org.springframework.web.util.UriComponentsBuilder;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.lang.reflect.Type;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Component
public class CacheableTemplateHelper {
    // Template metadata is used for showing the preview of the template

    CacheableApplicationTemplate applicationTemplateList = new CacheableApplicationTemplate();

    Map<String, CacheableApplicationJson> cacheableApplicationJsonMap = new HashMap<>();
    private static final int CACHE_LIFE_TIME_IN_SECONDS = 60 * 60 * 24; // 24 hours

    public Mono<CacheableApplicationTemplate> getTemplates(String releaseVersion, String baseUrl) {

        if (applicationTemplateList == null) {
            applicationTemplateList = new CacheableApplicationTemplate();
        }

        if (applicationTemplateList.getCacheExpiryTime() != null
                && isCacheValid(applicationTemplateList.getCacheExpiryTime())) {
            return Mono.just(applicationTemplateList);
        }

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
                        log.error("Error fetching templates from cloud services. Status code: {}", clientResponse);
                        return Flux.error(
                                new AppsmithException(AppsmithError.CLOUD_SERVICES_ERROR, clientResponse.statusCode()));
                    } else {
                        return clientResponse.createException().flatMapMany(Flux::error);
                    }
                })
                .collectList()
                .map(applicationTemplates -> {
                    applicationTemplateList.setApplicationTemplateList(applicationTemplates);
                    applicationTemplateList.setCacheExpiryTime(Instant.now());
                    return applicationTemplateList;
                });
    }

    // Actual JSON object of the template
    public Mono<CacheableApplicationJson> getApplicationByTemplateId(String templateId, String baseUrl) {
        final String templateUrl = baseUrl + "/api/v1/app-templates/" + templateId + "/application";
        /*
         * using a custom url builder factory because default builder always encodes
         * URL.
         * It's expected that the appDataUrl is already encoded, so we don't need to
         * encode that again.
         * Encoding an encoded URL will not work and end up resulting a 404 error
         */
        final int size = 4 * 1024 * 1024; // 4 MB

        if (cacheableApplicationJsonMap == null) {
            cacheableApplicationJsonMap = new HashMap<>();
        }

        if (cacheableApplicationJsonMap.containsKey(templateId)
                && isCacheValid(cacheableApplicationJsonMap.get(templateId).getCacheExpiryTime())) {
            return Mono.just(getCacheableApplicationJsonCopy(cacheableApplicationJsonMap.get(templateId)));
        }

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
                    Gson gson = getGson();
                    Type fileType = new TypeToken<ApplicationJson>() {}.getType();

                    CacheableApplicationJson cacheableApplicationJson = new CacheableApplicationJson();
                    cacheableApplicationJson.setApplicationJson(gson.fromJson(jsonString, fileType));
                    cacheableApplicationJson.setCacheExpiryTime(Instant.now());

                    // Remove/replace the value from cache
                    cacheableApplicationJsonMap.put(templateId, cacheableApplicationJson);
                    return getCacheableApplicationJsonCopy(cacheableApplicationJson);
                })
                .switchIfEmpty(
                        Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "template", templateId)));
    }

    private CacheableApplicationJson getCacheableApplicationJsonCopy(CacheableApplicationJson src) {
        Gson gson = getGson();
        return gson.fromJson(gson.toJson(src), CacheableApplicationJson.class);
    }

    @NotNull private Gson getGson() {
        return new GsonBuilder()
                .registerTypeAdapter(Instant.class, new ISOStringToInstantConverter())
                .create();
    }

    public boolean isCacheValid(Instant lastUpdatedAt) {
        return Instant.now().minusSeconds(CACHE_LIFE_TIME_IN_SECONDS).isBefore(lastUpdatedAt);
    }

    public Map<String, CacheableApplicationJson> getCacheableApplicationJsonMap() {
        return cacheableApplicationJsonMap;
    }
}
