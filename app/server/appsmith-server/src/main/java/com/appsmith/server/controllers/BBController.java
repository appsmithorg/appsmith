package com.appsmith.server.controllers;

import com.appsmith.external.views.Views;
import com.appsmith.server.bbhack.BBService;
import com.appsmith.server.constants.Url;
import com.appsmith.server.dtos.BBMainDTO;
import com.appsmith.server.dtos.BBResponseDTO;
import com.appsmith.server.dtos.ResponseDTO;
import com.fasterxml.jackson.annotation.JsonView;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.util.List;

@Slf4j
@RequestMapping(Url.BB_URL)
@RestController
@RequiredArgsConstructor
public class BBController {
    private final BBService bbService;

    @JsonView(Views.Public.class)
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<ResponseDTO<BBResponseDTO>> createCustomBuildingBlock(@Valid @RequestBody BBMainDTO dto) {
        return bbService
                .createCustomBuildingBlock(dto)
                .map(created -> new ResponseDTO<>(HttpStatus.CREATED.value(), created, null));
    }

    @JsonView(Views.Public.class)
    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    public Mono<ResponseDTO<List<BBResponseDTO>>> getAllBuildingBlocks() {
        return bbService
                .fetchAllBuildingBlocks()
                .map(bbResponseDTOS -> new ResponseDTO<>(HttpStatus.OK.value(), bbResponseDTOS, null));
    }
}
