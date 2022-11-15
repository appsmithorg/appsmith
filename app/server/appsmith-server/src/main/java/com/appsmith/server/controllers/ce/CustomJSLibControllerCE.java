package com.appsmith.server.controllers.ce;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.server.constants.Url;
import com.appsmith.server.dtos.ResponseDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.RequestMapping;
import reactor.core.publisher.Mono;

@Slf4j
@RequestMapping(Url.CUSTOM_JS_LIB_URL)
public class CustomJSLibControllerCE {

    // TODO: add service objects
    // TODO: check ActionControllerCE.java redundant params

    public CustomJSLibControllerCE() {
        // TODO: add args
    }

    // TODO: annotate
    // TODO: add args
    public Mono<ResponseDTO<ActionDTO>> addJSLibToApplication() {
        // TODO: fill
    }

    // TODO: annotate
    // TODO: add args
    public Mono<ResponseDTO<ActionDTO>> deleteJSLibFromApplication() {
        // TODO: fill
    }

    // TODO: annotate
    // TODO: add args
    public Mono<ResponseDTO<ActionDTO>> getAllUserInstalledJSLibInApplication() {
        // TODO: fill
    }
}
