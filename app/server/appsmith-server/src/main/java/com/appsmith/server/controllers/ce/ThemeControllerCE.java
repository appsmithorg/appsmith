package com.appsmith.server.controllers.ce;

import com.appsmith.external.views.Views;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.ApplicationMode;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.services.ThemeService;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import jakarta.validation.Valid;
import java.util.List;

@Slf4j
@RequestMapping(Url.THEME_URL)
public class ThemeControllerCE extends BaseController<ThemeService, Theme, String> {
    public ThemeControllerCE(ThemeService themeService) {
        super(themeService);
    }

    @Override
    public Mono<ResponseDTO<Theme>> create(Theme resource, String originHeader, ServerWebExchange exchange) {
        throw new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION);
    }

    @JsonView(Views.Public.class)
    @GetMapping("applications/{applicationId}")
    public Mono<ResponseDTO<List<Theme>>> getApplicationThemes(@PathVariable String applicationId,
                                                               @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName) {
        return service.getApplicationThemes(applicationId, branchName).collectList()
                .map(themes -> new ResponseDTO<>(HttpStatus.OK.value(), themes, null));
    }

    @JsonView(Views.Public.class)
    @GetMapping("applications/{applicationId}/current")
    public Mono<ResponseDTO<Theme>> getCurrentTheme(@PathVariable String applicationId,
                                                    @RequestParam(required = false, defaultValue = "EDIT") ApplicationMode mode,
                                                    @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName) {
        return service.getApplicationTheme(applicationId, mode, branchName)
                .map(theme -> new ResponseDTO<>(HttpStatus.OK.value(), theme, null));
    }

    @JsonView(Views.Public.class)
    @PutMapping("applications/{applicationId}")
    public Mono<ResponseDTO<Theme>> updateTheme(@PathVariable String applicationId,
                                                @Valid @RequestBody Theme resource,
                                                @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName) {
        return service.updateTheme(applicationId, branchName, resource)
                .map(theme -> new ResponseDTO<>(HttpStatus.OK.value(), theme, null));
    }

    @JsonView(Views.Public.class)
    @PatchMapping("applications/{applicationId}")
    public Mono<ResponseDTO<Theme>> publishCurrentTheme(@PathVariable String applicationId,
                                                        @RequestBody Theme resource,
                                                        @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName) {
        return service.persistCurrentTheme(applicationId, branchName, resource)
                .map(theme -> new ResponseDTO<>(HttpStatus.OK.value(), theme, null));
    }

    @JsonView(Views.Public.class)
    @PatchMapping("{themeId}")
    public Mono<ResponseDTO<Theme>> updateName(@PathVariable String themeId, @Valid @RequestBody Theme resource) {
        return service.updateName(themeId, resource)
                .map(theme -> new ResponseDTO<>(HttpStatus.OK.value(), theme, null));
    }
}
