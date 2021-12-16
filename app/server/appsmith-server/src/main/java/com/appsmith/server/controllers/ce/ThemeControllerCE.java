package com.appsmith.server.controllers.ce;

import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.ApplicationMode;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.services.ThemeService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import reactor.core.publisher.Mono;

import javax.validation.Valid;

@Slf4j
@RequestMapping(Url.THEME_URL)
public class ThemeControllerCE extends BaseController<ThemeService, Theme, String> {
    public ThemeControllerCE(ThemeService themeService) {
        super(themeService);
    }

    @GetMapping("applications/{applicationId}")
    public Mono<ResponseDTO<Theme>> getThemes(@PathVariable String applicationId, @RequestParam(required = false, defaultValue = "EDIT") ApplicationMode mode) {
        return service.getApplicationTheme(applicationId, mode)
                .map(theme -> new ResponseDTO<>(HttpStatus.OK.value(), theme, null));
    }

    @PostMapping("applications/{applicationId}")
    public Mono<ResponseDTO<Theme>> updateTheme(@PathVariable String applicationId, @Valid @RequestBody Theme resource) {
        return service.updateTheme(applicationId, resource)
                .map(theme -> new ResponseDTO<>(HttpStatus.OK.value(), theme, null));
    }
}
