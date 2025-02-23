package com.appsmith.server.controllers.ce;

import com.appsmith.external.views.Views;
import com.appsmith.server.constants.Url;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.dtos.UsagePulseDTO;
import com.appsmith.server.services.UsagePulseService;
import com.fasterxml.jackson.annotation.JsonView;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import reactor.core.publisher.Mono;

@RequiredArgsConstructor
@RequestMapping(Url.USAGE_PULSE_URL)
public class UsagePulseControllerCE {

    private final UsagePulseService service;

    @JsonView(Views.Public.class)
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<ResponseDTO<Boolean>> create(@RequestBody @Valid UsagePulseDTO usagePulseDTO) {
        return service.createPulse(usagePulseDTO).thenReturn(new ResponseDTO<>(HttpStatus.CREATED, true));
    }
}
