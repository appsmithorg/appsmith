package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.services.ThemeService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.util.List;

@Slf4j
@RestController
@RequestMapping(Url.THEME_URL)
public class ThemeController extends BaseController<ThemeService, Theme, String> {

    public ThemeController(ThemeService themeService) {
        super(themeService);
    }

    @GetMapping("applications/{applicationId}")
    public Mono<ResponseDTO<List<Theme>>> getThemes(@PathVariable String applicationId) {
        return service.getApplicationThemes(applicationId)
                .map(themeList -> new ResponseDTO<>(HttpStatus.OK.value(), themeList, null));
    }

    @PostMapping("applications/{applicationId}")
    public Mono<ResponseDTO<Theme>> createTheme(@PathVariable String applicationId, @RequestBody Theme resource) {
        return service.createTheme(applicationId, resource)
                .map(themeList -> new ResponseDTO<>(HttpStatus.OK.value(), themeList, null));
    }

    @PutMapping("{themeId}/applications/{applicationId}")
    public Mono<ResponseDTO<Theme>> updateTheme(
            @PathVariable String themeId, @PathVariable String applicationId, @RequestBody Theme resource) {
        return service.updateTheme(themeId, applicationId, resource)
                .map(theme -> new ResponseDTO<>(HttpStatus.OK.value(), theme, null));
    }
}
