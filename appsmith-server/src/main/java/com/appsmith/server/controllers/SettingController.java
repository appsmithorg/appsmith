package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.Setting;
import com.appsmith.server.services.SettingService;
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
