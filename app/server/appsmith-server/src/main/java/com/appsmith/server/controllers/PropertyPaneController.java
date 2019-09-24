package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.PropertyPane;
import com.appsmith.server.services.PropertyPaneService;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(Url.PROPERTY_URL)
public class PropertyPaneController extends BaseController<PropertyPaneService, PropertyPane, String> {
    public PropertyPaneController(PropertyPaneService service) {
        super(service);
    }
}
