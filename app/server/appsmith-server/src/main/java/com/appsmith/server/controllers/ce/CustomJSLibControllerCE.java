package com.appsmith.server.controllers.ce;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.services.CustomJSLibService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import reactor.core.publisher.Mono;

import javax.validation.Valid;
import java.util.List;

@Slf4j
@RequestMapping(Url.CUSTOM_JS_LIB_URL)
public class CustomJSLibControllerCE {
    private final CustomJSLibService customJSLibService;

    public CustomJSLibControllerCE(CustomJSLibService customJSLibService) {
        this.customJSLibService = customJSLibService;
    }

    @PatchMapping("/{applicationId}/add")
    public Mono<ResponseDTO<Boolean>> addJSLibToApplication(@RequestBody @Valid CustomJSLib customJSLib,
                                                            @PathVariable String applicationId, @RequestHeader(name =
            FieldName.BRANCH_NAME, required = false) String branchName, @RequestHeader(name =
            FieldName.IS_FORCE_INSTALL, defaultValue = "false") Boolean isForceInstall) {
        log.debug("Going to add JS lib: {}_{} to application: {}, on branch:{}", customJSLib.getName(),
                customJSLib.getVersion(), applicationId, branchName);
        return customJSLibService.addJSLibToApplication(applicationId, customJSLib, branchName, isForceInstall)
                .map(actionCollection -> new ResponseDTO<>(HttpStatus.OK.value(), actionCollection, null));
    }

    @PatchMapping("/{applicationId}/remove")
    public Mono<ResponseDTO<Boolean>> removeJSLibFromApplication(@RequestBody @Valid CustomJSLib customJSLib,
                                                                 @PathVariable String applicationId,
                                                                 @RequestHeader(name = FieldName.BRANCH_NAME,
                                                                         required = false) String branchName,
                                                                 @RequestHeader(name = FieldName.IS_FORCE_REMOVE,
                                                                         defaultValue = "false") Boolean isForceRemove) {
        log.debug("Going to remove JS lib: {}_{} from application: {}, on branch:{}", customJSLib.getName(),
                customJSLib.getVersion(), applicationId, branchName);
        return customJSLibService.removeJSLibFromApplication(applicationId, customJSLib, branchName, isForceRemove)
                .map(actionCollection -> new ResponseDTO<>(HttpStatus.OK.value(), actionCollection, null));
    }

    @GetMapping("/{applicationId}")
    public Mono<ResponseDTO<List<CustomJSLib>>> getAllUserInstalledJSLibInApplication(@PathVariable String applicationId,
                                                                                      @RequestHeader(name =
                                                                                              FieldName.BRANCH_NAME,
                                                                                              required = false) String branchName) {
        log.debug("Going to get all unpublished JS libs in application: {}, on branch: {}", applicationId, branchName);
        return customJSLibService.getAllJSLibsInApplication(applicationId, branchName, false)
                .map(actionCollection -> new ResponseDTO<>(HttpStatus.OK.value(), actionCollection, null));
    }

    @GetMapping("/{applicationId}/view")
    public Mono<ResponseDTO<List<CustomJSLib>>> getAllUserInstalledJSLibInApplicationForViewMode(@PathVariable String applicationId,
                                                                                                 @RequestHeader(name =FieldName.BRANCH_NAME,
                                                                                                         required = false)
                                                                                                 String branchName) {
        log.debug("Going to get all published JS libs in application: {}, on branch: {}", applicationId, branchName);
        return customJSLibService.getAllJSLibsInApplication(applicationId, branchName, true)
                .map(actionCollection -> new ResponseDTO<>(HttpStatus.OK.value(), actionCollection, null));
    }
}