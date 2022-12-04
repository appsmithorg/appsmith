package com.appsmith.server.controllers.ce;

import com.appsmith.server.constants.Url;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.NewActionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import com.appsmith.server.dtos.AnalyticEventDTO;
import reactor.core.publisher.Mono;

import javax.validation.Valid;

@RequiredArgsConstructor
@RequestMapping(Url.ANALYTICS_URL)
public class AnalyticsControllerCE {


    private final ApplicationPageService applicationPageService;

    private final NewActionService newActionService;

    @PostMapping("/event")
    public Mono<ResponseDTO<Void>> postEvent(@RequestBody @Valid AnalyticEventDTO analyticEventDTO) {
        Mono resultMono = null;
        switch (analyticEventDTO.getResourceType()) {
            case PAGE:
                resultMono = applicationPageService.sendPageAnalyticsEvent(analyticEventDTO);
                break;
            case ACTION:
                resultMono = newActionService.sendNewActionAnalyticsEvent(analyticEventDTO);
                break;
        }
        return resultMono
                .thenReturn(new ResponseDTO<>(HttpStatus.OK.value(), null, null));
    }

}
