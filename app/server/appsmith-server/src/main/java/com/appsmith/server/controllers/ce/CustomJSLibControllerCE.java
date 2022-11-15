package com.appsmith.server.controllers.ce;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.dtos.CustomJSLibDTO;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.services.CustomJSLibServiceImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
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
    private final CustomJSLibServiceImpl customJSLibService;

    // TODO: check ActionControllerCE.java redundant params

    public CustomJSLibControllerCE(CustomJSLibServiceImpl customJSLibService) {
        this.customJSLibService = customJSLibService;
    }

    @PatchMapping("/add")
    public Mono<ResponseDTO<Boolean>> addJSLibToApplication(@RequestBody @Valid CustomJSLibDTO customJSLibDTO,
                                                              @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName) {
        log.debug("Going to add JS lib {} to application {} , on branch:{}", customJSLibDTO.getJsLib().getName(),
                customJSLibDTO.getApplicationId(), branchName);
        return customJSLibService.addJSLibToApplication(customJSLibDTO.getApplicationId(), customJSLibDTO.getJsLib())
                .map(actionCollection -> new ResponseDTO<>(HttpStatus.OK.value(), actionCollection, null));
    }

    @PatchMapping("/remove")
    public Mono<ResponseDTO<Boolean>> removeJSLibFromApplication(@RequestBody @Valid CustomJSLibDTO customJSLibDTO,
                                                                   @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName) {
        log.debug("Going to remove JS lib {} from application {} , on branch:{}", customJSLibDTO.getJsLib().getName(),
                customJSLibDTO.getApplicationId(), branchName);
        return customJSLibService.removeJSLibFromApplication(customJSLibDTO.getApplicationId(), customJSLibDTO.getJsLib())
                .map(actionCollection -> new ResponseDTO<>(HttpStatus.OK.value(), actionCollection, null));
    }

    @GetMapping("/{applicationId}")
    public Mono<ResponseDTO<List<CustomJSLib>>> getAllUserInstalledJSLibInApplication(@PathVariable String applicationId,
                                                                                      @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName) {
        log.debug("Going to get all JS libs in application {} , on branch:{}", applicationId, branchName);
        return customJSLibService.getAllJSLibsInApplication(applicationId)
                .map(actionCollection -> new ResponseDTO<>(HttpStatus.OK.value(), actionCollection, null));
    }
}
