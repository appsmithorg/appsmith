package com.appsmith.server.solutions;

import com.appsmith.server.configurations.CloudServicesConfig;
import com.appsmith.server.domains.License;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.dtos.LicenseValidationResponseDTO;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.HmacHashUtils;
import com.appsmith.server.helpers.SignatureVerifier;
import com.appsmith.server.services.ConfigService;
import com.appsmith.util.WebClientUtils;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.core.codec.DecodingException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;

import java.util.Objects;

import static com.appsmith.server.constants.ApiConstants.CLOUD_SERVICES_SIGNATURE;
import static com.appsmith.server.constants.ApiConstants.HMAC_SIGNATURE_HEADER;
import static java.lang.Boolean.TRUE;

/**
 * Class dedicated to SELF_SERVE and ENTERPRISE license validations
 */
@Slf4j
public class OnlineLicenseAPIManagerImpl extends BaseLicenseAPIManagerImpl implements LicenseAPIManager {
    private final CloudServicesConfig cloudServicesConfig;

    public OnlineLicenseAPIManagerImpl(
            ReleaseNotesService releaseNotesService,
            ConfigService configService,
            CloudServicesConfig cloudServicesConfig) {
        super(releaseNotesService, configService);
        this.cloudServicesConfig = cloudServicesConfig;
    }

    /**
     * To check the license of a tenant with Cloud Services
     *
     * @param tenant
     * @return License
     */
    public Mono<License> licenseCheck(Tenant tenant) {
        log.debug("Initiating online license check for tenant {}", tenant.getId());
        final String baseUrl = cloudServicesConfig.getBaseUrlWithSignatureVerification();
        if (StringUtils.isEmpty(baseUrl)) {
            log.error("Unable to find cloud services base URL. Shutting down.");
            // Shutting down server as we can't check the license validity without cloud-server
            System.exit(1);
        }

        License license = TRUE.equals(isLicenseKeyValid(tenant))
                ? tenant.getTenantConfiguration().getLicense()
                : new License();

        if (StringUtils.isEmpty(license.getKey())) {
            log.debug("License key not found for tenant {}", tenant.getId());
            return Mono.just(license);
        }

        return this.populateLicenseValidationRequest(tenant)
                .flatMap(requestDTO -> {
                    Mono<ResponseEntity<ResponseDTO<LicenseValidationResponseDTO>>> responseEntityMono =
                            WebClientUtils.create(baseUrl + "/api/v2/license/validate")
                                    .post()
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .accept(MediaType.APPLICATION_JSON)
                                    .body(BodyInserters.fromValue(requestDTO))
                                    .retrieve()
                                    .toEntity(new ParameterizedTypeReference<>() {});

                    return responseEntityMono.flatMap(entity -> {
                        HttpHeaders headers = entity.getHeaders();
                        if (!SignatureVerifier.isSignatureValid(headers)) {
                            return Mono.error(
                                    new AppsmithException(AppsmithError.INVALID_PARAMETER, CLOUD_SERVICES_SIGNATURE));
                        }
                        return Mono.just(Objects.requireNonNull(entity.getBody()));
                    });
                })
                .onErrorMap(
                        // Only map errors if we haven't already wrapped them into an AppsmithException
                        e -> !(e instanceof AppsmithException),
                        e -> new AppsmithException(AppsmithError.CLOUD_SERVICES_ERROR, e.getMessage()))
                .map(ResponseDTO::getData)
                .map(licenseValidationResponse -> {
                    log.debug(
                            "License validation completed for tenant {} with status {}",
                            tenant.getId(),
                            licenseValidationResponse.isValid());
                    license.updateLicenseFromValidationResponse(licenseValidationResponse);
                    return license;
                });
    }

    @Override
    public Mono<Boolean> downgradeTenantToFreePlan(Tenant tenant) {
        if (tenant.getTenantConfiguration() == null
                || tenant.getTenantConfiguration().getLicense() == null) {
            return Mono.just(TRUE);
        }

        log.debug("Initiating downgrade to free plan for tenant {}", tenant.getId());
        final String baseUrl = cloudServicesConfig.getBaseUrlWithSignatureVerification();
        return this.populateTenantDowngradeRequest(tenant).flatMap(requestDTO -> {
            final String licenseKey =
                    tenant.getTenantConfiguration().getLicense().getKey();
            if (StringUtils.isEmpty(licenseKey)) {
                return Mono.just(TRUE);
            }
            final String signatureHeader = HmacHashUtils.createHash(requestDTO.toString(), licenseKey);
            return WebClientUtils.create(baseUrl + "/api/v1/instance/downgrade")
                    .put()
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .header(HMAC_SIGNATURE_HEADER, signatureHeader)
                    .body(BodyInserters.fromValue(requestDTO))
                    .exchangeToMono(clientResponse -> {
                        if (clientResponse.statusCode().is2xxSuccessful()) {
                            return clientResponse.bodyToMono(new ParameterizedTypeReference<ResponseDTO<Boolean>>() {});
                        } else {
                            return clientResponse.createError();
                        }
                    })
                    .map(ResponseDTO::getData)
                    .onErrorMap(WebClientResponseException.class, e -> {
                        ResponseDTO<Boolean> responseDTO;
                        try {
                            responseDTO = e.getResponseBodyAs(new ParameterizedTypeReference<>() {});
                        } catch (DecodingException | IllegalStateException e2) {
                            return e;
                        }
                        if (responseDTO != null
                                && responseDTO.getResponseMeta() != null
                                && responseDTO.getResponseMeta().getError() != null) {
                            return new AppsmithException(
                                    AppsmithError.TENANT_DOWNGRADE_EXCEPTION,
                                    responseDTO.getResponseMeta().getError().getMessage());
                        }
                        return e;
                    })
                    .onErrorMap(
                            // Only map errors if we haven't already wrapped them into an AppsmithException
                            e -> !(e instanceof AppsmithException),
                            e -> new AppsmithException(AppsmithError.CLOUD_SERVICES_ERROR, e.getMessage()));
        });
    }
}
