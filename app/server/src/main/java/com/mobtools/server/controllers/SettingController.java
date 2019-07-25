package com.mobtools.server.controllers;

import com.mobtools.server.constants.Url;
import com.mobtools.server.domains.Setting;
import com.mobtools.server.services.SettingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(Url.SETTING_URL)
public class SettingController extends BaseController<SettingService, Setting, String> {

    @Autowired
    public SettingController(SettingService settingService) {
        super(settingService);
    }
}
