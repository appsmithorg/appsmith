package com.appsmith.server.controllers.ce;

import com.appsmith.external.views.Views;
import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.ApplicationMode;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.themes.base.ThemeService;
import com.fasterxml.jackson.annotation.JsonView;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import reactor.core.publisher.Mono;

import java.util.List;

@Slf4j
@RequestMapping(Url.THEME_URL)
@RequiredArgsConstructor
public class ThemeControllerCE {

    private final ThemeService service;

    @JsonView(Views.Public.class)
    @GetMapping("applications/{branchedApplicationId}")
    public Mono<ResponseDTO<List<Theme>>> getApplicationThemes(@PathVariable String branchedApplicationId) {
        return service.getApplicationThemes(branchedApplicationId)
                .collectList()
                .map(themes -> new ResponseDTO<>(HttpStatus.OK, themes));
    }

    @JsonView(Views.Public.class)
    @GetMapping("applications/{branchedApplicationId}/current")
    public Mono<ResponseDTO<Theme>> getCurrentTheme(
            @PathVariable String branchedApplicationId,
            @RequestParam(required = false, defaultValue = "EDIT") ApplicationMode mode) {
        return service.getApplicationTheme(branchedApplicationId, mode)
                .map(theme -> new ResponseDTO<>(HttpStatus.OK, theme));
    }

    @JsonView(Views.Public.class)
    @PutMapping("applications/{branchedApplicationId}")
    public Mono<ResponseDTO<Theme>> updateTheme(
            @PathVariable String branchedApplicationId, @Valid @RequestBody Theme resource) {
        return service.updateTheme(branchedApplicationId, resource)
                .map(theme -> new ResponseDTO<>(HttpStatus.OK, theme));
    }

    @JsonView(Views.Public.class)
    @PatchMapping("{themeId}")
    public Mono<ResponseDTO<Theme>> updateName(@PathVariable String themeId, @Valid @RequestBody Theme resource) {
        return service.updateName(themeId, resource).map(theme -> new ResponseDTO<>(HttpStatus.OK, theme));
    }
}
