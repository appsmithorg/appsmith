package com.appsmith.server.controllers;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.Url;
import com.appsmith.server.dtos.AnalyticEventDTO;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.services.NewActionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
@RequiredArgsConstructor
@RequestMapping(Url.ANALYTICS_URL)
public class AnalyticsController {
    private final NewActionService newActionService;

    @PostMapping("/event")
    public Mono<ResponseDTO<Void>> postEvent(@RequestBody @Valid AnalyticEventDTO analyticEventDTO) {
        Mono resultMono = null;
        switch (analyticEventDTO.getResourceType()) {
            case ACTION:
                resultMono = newActionService.sendNewActionAnalyticsEvent(analyticEventDTO, FieldName.AUDIT_LOGS_ORIGIN_CLIENT);
                break;
        }
        return resultMono
                .thenReturn(new ResponseDTO<>(HttpStatus.OK.value(), null, null));
    }

}
