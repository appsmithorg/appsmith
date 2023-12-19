package com.appsmith.server.applications.base;

import com.appsmith.server.applications.imports.ApplicationImportServiceCE;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.ImportableContextJson;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

import java.lang.reflect.Type;

public class ApplicationImportServiceCEImpl implements ApplicationImportServiceCE {

    private final Gson gson = new Gson();

    public ApplicationImportServiceCEImpl() {}

    @Override
    public ImportableContextJson extractImportableContextJson(String jsonString) {
        Type fileType = new TypeToken<ApplicationJson>() {}.getType();
        ApplicationJson jsonFile = gson.fromJson(jsonString, fileType);
        return jsonFile;
    }
}
