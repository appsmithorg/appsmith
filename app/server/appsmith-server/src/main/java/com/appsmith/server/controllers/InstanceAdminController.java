package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.solutions.EnvManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import javax.validation.Valid;
import java.util.Map;

@RestController
@RequestMapping(Url.INSTANCE_ADMIN_URL)
@RequiredArgsConstructor
@Slf4j
public class InstanceAdminController {

    private final EnvManager envManager;

    @PutMapping("/env")
    public Mono<ResponseDTO<Boolean>> saveEnvChanges(
            @Valid @RequestBody Map<String, String> changes
    ) {
        log.debug("Applying env updates {}", changes);
        return envManager.applyChanges(changes)
                .map(isSaved -> new ResponseDTO<>(HttpStatus.OK.value(), isSaved, null));
    }

}
