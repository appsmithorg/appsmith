package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.controllers.ce.ThemeControllerCE;
import com.appsmith.server.services.ThemeService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping(Url.THEME_URL)
public class ThemeController extends ThemeControllerCE {

    public ThemeController(ThemeService themeService) {
        super(themeService);
    }
}
