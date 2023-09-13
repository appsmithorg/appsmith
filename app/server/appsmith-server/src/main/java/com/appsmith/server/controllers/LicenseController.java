package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.dtos.UpdateLicenseKeyDTO;
import com.appsmith.server.services.TenantService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@RestController
@Slf4j
@RequestMapping(Url.LICENSE_URL)
@RequiredArgsConstructor
public class LicenseController {

    private final TenantService service;

    @PutMapping("")
    public Mono<ResponseDTO<Tenant>> updateTenantLicenseKey(@RequestBody UpdateLicenseKeyDTO updateLicenseKeyDTO) {
        log.debug("Going to update the license key for default tenant");
        return service.updateTenantLicenseKey(updateLicenseKeyDTO)
                .map(tenant -> new ResponseDTO<>(HttpStatus.OK.value(), tenant, null));
    }

    @PostMapping("")
    public Mono<ResponseDTO<String>> activateTenantAndGetRedirectUrl(
            @RequestBody UpdateLicenseKeyDTO updateLicenseKeyDTO, ServerWebExchange exchange) {
        String logMessage = "Going to activate the tenant"
                + (StringUtils.hasLength(updateLicenseKeyDTO.getKey())
                        ? " with the license key"
                        : " without license key");
        log.debug(logMessage);
        return service.activateTenantAndGetRedirectUrl(updateLicenseKeyDTO, exchange)
                .map(tenant -> new ResponseDTO<>(HttpStatus.OK.value(), tenant, null));
    }

    /**
     * API to refresh the current license status from the Cloud Services and return the latest status
     * @return Mono of ResponseDTO of Tenant
     */
    @GetMapping("")
    public Mono<ResponseDTO<Tenant>> getLicense() {
        log.debug("Going to refresh the current license status from the Cloud Services and return the latest status");
        return service.refreshAndGetCurrentLicense()
                .map(tenant -> new ResponseDTO<>(HttpStatus.OK.value(), tenant, null));
    }

    @DeleteMapping("")
    public Mono<ResponseDTO<Tenant>> removeLicenseKey() {
        log.debug("Going to remove the license key for default tenant and execute downgrade migrations");
        return service.removeLicenseKey().map(tenant -> new ResponseDTO<>(HttpStatus.OK.value(), tenant, null));
    }

    @PutMapping("/sync-plan")
    public Mono<ResponseDTO<Tenant>> syncLicensePlans() {
        log.debug("Going to sync license plans and run feature based migrations");
        return service.syncLicensePlansAndRunFeatureBasedMigrations()
                .map(tenant -> new ResponseDTO<>(HttpStatus.OK.value(), tenant, null));
    }
}
