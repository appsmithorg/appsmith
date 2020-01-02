package com.appsmith.server.services;

import com.appsmith.server.domains.Action;

public abstract class BaseApiImporter implements ApiImporter {

    public abstract Action importAction(Object input);

}
