package com.appsmith.server.services.ce;

import com.appsmith.caching.annotations.Cache;
import com.appsmith.server.configurations.CloudServicesConfig;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.PylonEmailHashRequestDTO;
import com.appsmith.server.dtos.PylonEmailHashResponseDTO;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.SignatureVerifier;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.solutions.ReleaseNotesService;
import com.appsmith.util.WebClientUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.util.StringUtils;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import static com.appsmith.server.constants.ApiConstants.CLOUD_SERVICES_SIGNATURE;

/**
 * Fetches the Pylon chat identity-verification hash for a user from Cloud Services and caches it.
 *
 * <p>The HMAC secret used to compute the hash lives only in Cloud Services; the self-hosted instance no longer holds
 * it. The hash is deterministic for a given email, so it is cached per user (keyed by the user id). On any Cloud
 * Services failure we emit an empty result: the cache aspect only stores emitted values, so failures are never cached
 * and the next profile load retries, while the user simply gets an unverified Pylon session in the meantime.
 */
@Slf4j
public class CacheablePylonHelperCEImpl implements CacheablePylonHelperCE {

    // Dedicated WebClient for Cloud Services calls with optimized connection pool
    private final WebClient cloudServicesWebClient;

    private final ConfigService configService;
    private final CloudServicesConfig cloudServicesConfig;
    private final ReleaseNotesService releaseNotesService;

    public CacheablePylonHelperCEImpl(
            ConfigService configService,
            CloudServicesConfig cloudServicesConfig,
            ReleaseNotesService releaseNotesService) {
        this.configService = configService;
        this.cloudServicesConfig = cloudServicesConfig;
        this.releaseNotesService = releaseNotesService;
        this.cloudServicesWebClient = WebClientUtils.createForCloudServices();
    }

    @Cache(cacheName = "pylonEmailHash", key = "{#user.id}")
    @Override
    public Mono<String> getEmailHash(User user) {
        // Anonymous users still carry a non-empty placeholder email (e.g. "anonymousUser"), so the email
        // check alone would let them through and trigger a pointless CS round-trip on every profile load.
        if (user.isAnonymous() || !StringUtils.hasText(user.getEmail())) {
            return Mono.empty();
        }

        return configService
                .getInstanceId()
                .flatMap(instanceId -> {
                    PylonEmailHashRequestDTO requestDTO = new PylonEmailHashRequestDTO(
                            user.getEmail(),
                            new PylonEmailHashRequestDTO.InstanceMetadata(
                                    instanceId, user.getOrganizationId(), releaseNotesService.getRunningVersion()));
                    return cloudServicesWebClient
                            .post()
                            .uri(cloudServicesConfig.getBaseUrlWithSignatureVerification() + "/api/v1/pylon/email-hash")
                            .body(BodyInserters.fromValue(requestDTO))
                            .exchangeToMono(clientResponse -> {
                                if (clientResponse.statusCode().is2xxSuccessful()) {
                                    HttpHeaders headers =
                                            clientResponse.headers().asHttpHeaders();
                                    if (!SignatureVerifier.isSignatureValid(headers)) {
                                        return Mono.error(new AppsmithException(
                                                AppsmithError.INVALID_PARAMETER, CLOUD_SERVICES_SIGNATURE));
                                    }
                                    return clientResponse.bodyToMono(
                                            new ParameterizedTypeReference<
                                                    ResponseDTO<PylonEmailHashResponseDTO>>() {});
                                } else {
                                    return clientResponse.createError();
                                }
                            })
                            // mapNotNull (rather than map) so a CS response with a null `data` or null
                            // `emailHash` completes empty instead of NPE-ing inside the reactor pipeline
                            // and falling through to the noisy onErrorResume warn log below.
                            .mapNotNull(ResponseDTO::getData)
                            .mapNotNull(PylonEmailHashResponseDTO::getEmailHash)
                            .timeout(WebClientUtils.CLOUD_SERVICES_API_TIMEOUT);
                })
                .onErrorResume(error -> {
                    // Chat identity verification is best-effort: if CS is unreachable we degrade to an unverified
                    // Pylon session rather than failing the user profile request.
                    log.warn("Failed to fetch Pylon email hash from Cloud Services: {}", error.getMessage());
                    return Mono.empty();
                });
    }
}
