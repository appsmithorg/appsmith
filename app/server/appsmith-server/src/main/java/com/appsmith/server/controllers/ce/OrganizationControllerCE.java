package com.appsmith.server.controllers.ce;

import com.appsmith.external.views.Views;
import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.OrganizationConfiguration;
import com.appsmith.server.dtos.AIConfigDTO;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.services.OrganizationService;
import com.fasterxml.jackson.annotation.JsonView;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.Map;

import static com.appsmith.server.acl.AclPermission.MANAGE_ORGANIZATION;

@Slf4j
@RequestMapping(Url.ORGANIZATION_URL)
public class OrganizationControllerCE {

    private final OrganizationService service;

    public OrganizationControllerCE(OrganizationService service) {
        this.service = service;
    }

    /**
     * This API returns the organization configuration for any user (anonymous or logged in). The configurations are set
     * in {@link com.appsmith.server.controllers.ce.InstanceAdminControllerCE#saveEnvChanges(Map<String,String>)}
     * <p>
     * The update and retrieval are in different controllers because it would have been weird to fetch the configurations
     * from the InstanceAdminController
     *
     * @return
     */
    @JsonView(Views.Public.class)
    @GetMapping("/current")
    public Mono<ResponseDTO<Organization>> getOrganizationConfig() {
        log.debug("Attempting to retrieve organization configuration ... ");
        return service.getOrganizationConfiguration().map(resource -> new ResponseDTO<>(HttpStatus.OK, resource));
    }

    @PutMapping("")
    public Mono<ResponseDTO<Organization>> updateOrganizationConfiguration(
            @RequestBody OrganizationConfiguration organizationConfiguration) {
        return service.updateOrganizationConfiguration(organizationConfiguration)
                .map(organization -> new ResponseDTO<>(HttpStatus.OK, organization));
    }

    @JsonView(Views.Public.class)
    @PutMapping("/ai-config")
    public Mono<ResponseDTO<Map<String, Object>>> updateAIConfig(@RequestBody @Valid AIConfigDTO aiConfig) {
        return service.getCurrentUserOrganizationId()
                .flatMap(organizationId -> service.findById(organizationId, MANAGE_ORGANIZATION)
                        .switchIfEmpty(Mono.error(new AppsmithException(
                                AppsmithError.ACL_NO_RESOURCE_FOUND, "organization", organizationId)))
                        .flatMap(organization -> {
                            OrganizationConfiguration config = organization.getOrganizationConfiguration();
                            if (config == null) {
                                config = new OrganizationConfiguration();
                            }

                            if (aiConfig.getClaudeApiKey() != null
                                    && !aiConfig.getClaudeApiKey().trim().isEmpty()) {
                                String trimmedKey = aiConfig.getClaudeApiKey().trim();
                                if (trimmedKey.length() > 500) {
                                    return Mono.error(new AppsmithException(
                                            AppsmithError.INVALID_PARAMETER, "API key is too long"));
                                }
                                config.setClaudeApiKey(trimmedKey);
                            }
                            if (aiConfig.getOpenaiApiKey() != null
                                    && !aiConfig.getOpenaiApiKey().trim().isEmpty()) {
                                String trimmedKey = aiConfig.getOpenaiApiKey().trim();
                                if (trimmedKey.length() > 500) {
                                    return Mono.error(new AppsmithException(
                                            AppsmithError.INVALID_PARAMETER, "API key is too long"));
                                }
                                config.setOpenaiApiKey(trimmedKey);
                            }
                            if (aiConfig.getProvider() != null) {
                                config.setAiProvider(aiConfig.getProvider());
                            }
                            if (aiConfig.getIsAIAssistantEnabled() != null) {
                                config.setIsAIAssistantEnabled(aiConfig.getIsAIAssistantEnabled());
                            }

                            return service.updateOrganizationConfiguration(organizationId, config)
                                    .map(updatedOrg -> {
                                        Map<String, Object> response = new HashMap<>();
                                        response.put(
                                                "isAIAssistantEnabled",
                                                updatedOrg
                                                        .getOrganizationConfiguration()
                                                        .getIsAIAssistantEnabled());
                                        response.put(
                                                "provider",
                                                updatedOrg
                                                        .getOrganizationConfiguration()
                                                        .getAiProvider());
                                        response.put(
                                                "hasClaudeApiKey",
                                                updatedOrg
                                                                        .getOrganizationConfiguration()
                                                                        .getClaudeApiKey()
                                                                != null
                                                        && !updatedOrg
                                                                .getOrganizationConfiguration()
                                                                .getClaudeApiKey()
                                                                .isEmpty());
                                        response.put(
                                                "hasOpenaiApiKey",
                                                updatedOrg
                                                                        .getOrganizationConfiguration()
                                                                        .getOpenaiApiKey()
                                                                != null
                                                        && !updatedOrg
                                                                .getOrganizationConfiguration()
                                                                .getOpenaiApiKey()
                                                                .isEmpty());
                                        return response;
                                    });
                        }))
                .map(result -> new ResponseDTO<>(HttpStatus.OK, result))
                .onErrorResume(error -> {
                    String errorMessage = "Failed to update AI configuration";
                    if (error instanceof AppsmithException) {
                        AppsmithException appsmithError = (AppsmithException) error;
                        if (appsmithError.getError() == AppsmithError.ACL_NO_RESOURCE_FOUND) {
                            errorMessage = "You do not have permission to update this configuration";
                        } else {
                            errorMessage = appsmithError.getError().getMessage();
                        }
                    }
                    return Mono.just(
                            new ResponseDTO<Map<String, Object>>(HttpStatus.BAD_REQUEST.value(), null, errorMessage));
                });
    }

    @JsonView(Views.Public.class)
    @GetMapping("/ai-config")
    public Mono<ResponseDTO<Map<String, Object>>> getAIConfig() {
        return service.getCurrentUserOrganization()
                .map(organization -> {
                    Map<String, Object> response = new HashMap<>();
                    if (organization.getOrganizationConfiguration() != null) {
                        OrganizationConfiguration config = organization.getOrganizationConfiguration();
                        response.put(
                                "isAIAssistantEnabled",
                                config.getIsAIAssistantEnabled() != null ? config.getIsAIAssistantEnabled() : false);
                        response.put("provider", config.getAiProvider());
                        response.put(
                                "hasClaudeApiKey",
                                config.getClaudeApiKey() != null
                                        && !config.getClaudeApiKey().isEmpty());
                        response.put(
                                "hasOpenaiApiKey",
                                config.getOpenaiApiKey() != null
                                        && !config.getOpenaiApiKey().isEmpty());
                    } else {
                        response.put("isAIAssistantEnabled", false);
                        response.put("provider", null);
                        response.put("hasClaudeApiKey", false);
                        response.put("hasOpenaiApiKey", false);
                    }
                    return response;
                })
                .map(result -> new ResponseDTO<>(HttpStatus.OK, result));
    }
}
