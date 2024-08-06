package com.appsmith.server.controllers.ce;

import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.views.Views;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.jslibs.base.CustomJSLibService;
import com.fasterxml.jackson.annotation.JsonView;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Set;

@Slf4j
@RequestMapping(Url.CUSTOM_JS_LIB_URL)
public class CustomJSLibControllerCE {
    private final CustomJSLibService customJSLibService;

    public CustomJSLibControllerCE(CustomJSLibService customJSLibService) {
        this.customJSLibService = customJSLibService;
    }

    @JsonView(Views.Public.class)
    @PatchMapping("/{branchedApplicationId}/add")
    public Mono<ResponseDTO<Boolean>> addJSLibToApplication(
            @RequestBody @Valid CustomJSLib customJSLib,
            @PathVariable String branchedApplicationId,
            @RequestParam(defaultValue = "APPLICATION") CreatorContextType contextType,
            @RequestHeader(name = FieldName.IS_FORCE_INSTALL, defaultValue = "false") Boolean isForceInstall) {
        log.debug(
                "Going to add JS lib: {}_{} to {}: {}",
                customJSLib.getName(),
                customJSLib.getVersion(),
                contextType.name().toLowerCase(),
                branchedApplicationId);
        return customJSLibService
                .addJSLibsToContext(branchedApplicationId, contextType, Set.of(customJSLib), isForceInstall)
                .map(actionCollection -> new ResponseDTO<>(HttpStatus.OK.value(), actionCollection, null));
    }

    @JsonView(Views.Public.class)
    @PatchMapping("/{branchedApplicationId}/remove")
    public Mono<ResponseDTO<Boolean>> removeJSLibFromApplication(
            @RequestBody @Valid CustomJSLib customJSLib,
            @PathVariable String branchedApplicationId,
            @RequestParam(defaultValue = "APPLICATION") CreatorContextType contextType,
            @RequestHeader(name = FieldName.IS_FORCE_REMOVE, defaultValue = "false") Boolean isForceRemove) {
        log.debug(
                "Going to remove JS lib: {} from {}: {}",
                customJSLib.getUidString(),
                contextType.name().toLowerCase(),
                branchedApplicationId);
        return customJSLibService
                .removeJSLibFromContext(branchedApplicationId, contextType, customJSLib, isForceRemove)
                .map(actionCollection -> new ResponseDTO<>(HttpStatus.OK.value(), actionCollection, null));
    }

    @JsonView(Views.Public.class)
    @GetMapping("/{branchedContextId}")
    public Mono<ResponseDTO<List<CustomJSLib>>> getAllUserInstalledJSLibInApplication(
            @PathVariable String branchedContextId,
            @RequestParam(defaultValue = "APPLICATION") CreatorContextType contextType) {
        log.debug(
                "Going to get all unpublished JS libs in {}: {}, on branch: {}",
                contextType.name().toLowerCase(),
                branchedContextId);
        return customJSLibService
                .getAllJSLibsInContext(branchedContextId, contextType, false)
                .map(actionCollection -> new ResponseDTO<>(HttpStatus.OK.value(), actionCollection, null));
    }

    @JsonView(Views.Public.class)
    @GetMapping("/{branchedContextId}/view")
    public Mono<ResponseDTO<List<CustomJSLib>>> getAllUserInstalledJSLibInApplicationForViewMode(
            @PathVariable String branchedContextId,
            @RequestParam(defaultValue = "APPLICATION") CreatorContextType contextType,
            @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName) {
        log.debug(
                "Going to get all published JS libs in {}: {}, on branch: {}",
                contextType.name().toLowerCase(),
                branchedContextId,
                branchName);
        return customJSLibService
                .getAllJSLibsInContext(branchedContextId, contextType, true)
                .map(actionCollection -> new ResponseDTO<>(HttpStatus.OK.value(), actionCollection, null));
    }
}
