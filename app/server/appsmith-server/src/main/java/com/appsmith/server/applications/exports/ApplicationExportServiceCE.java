package com.appsmith.server.applications.exports;

import com.appsmith.server.domains.Application;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.exports.internal.ContextBasedExportService;

public interface ApplicationExportServiceCE extends ContextBasedExportService<Application, ApplicationJson> {}
