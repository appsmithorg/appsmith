package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.dtos.ActionDTO;
import com.appsmith.server.dtos.AddItemToPageDTO;
import com.appsmith.server.dtos.ItemDTO;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.dtos.TestParent;
import com.appsmith.server.services.ItemService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/test")
public class TestController {

    @PostMapping("")
    public Mono<ResponseDTO<TestParent>> test(@RequestBody TestParent test) {
        log.debug("Test: {}", test);
        return null;
    }
}
