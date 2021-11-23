package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.services.ThemeService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.util.List;

@Slf4j
@RestController
@RequestMapping(Url.THEME_URL)
public class ThemeController extends BaseController<ThemeService, Theme, String> {
    // private final ThemeService themeService;

    public ThemeController(ThemeService themeService) {
        super(themeService);
        // this.themeService = themeService;
    }

    @GetMapping("applications/{applicationId}")
    public Mono<ResponseDTO<List<Theme>>> getApplicationThemes(@PathVariable String applicationId) {
        return service.getApplicationThemes(applicationId)
                .map(themeList -> new ResponseDTO<>(HttpStatus.OK.value(), themeList, null));
    }
}
