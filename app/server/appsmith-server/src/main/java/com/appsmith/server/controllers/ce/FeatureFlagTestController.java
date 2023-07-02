package com.appsmith.server.controllers.ce;

import com.appsmith.external.models.DatasourceDTO;
import com.appsmith.external.views.Views;
import com.appsmith.server.constants.Url;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.services.DatasourceService;
import com.appsmith.server.services.FeatureFlagService;
import com.fasterxml.jackson.annotation.JsonView;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.core.scheduler.Schedulers;

@Slf4j
@RequestMapping(Url.FEATURE_FLAG_TEST)
public class FeatureFlagTestController {
    private final FeatureFlagService featureFlagService;

    public static final Scheduler scheduler = Schedulers.boundedElastic();

    @Autowired
    public FeatureFlagTestController(FeatureFlagService featureFlagService) {
        this.featureFlagService = featureFlagService;
    }

    @JsonView(Views.Public.class)
    @GetMapping("/testfeature")
    public Mono<ResponseDTO<Boolean>> getAll() {
        return featureFlagService.check(FeatureFlagEnum.TEST_FEATURE_1).map(res -> {log.info("{}", res); return new ResponseDTO<>(HttpStatus.OK.value(), res, null);}).subscribeOn(scheduler);
    }
}
