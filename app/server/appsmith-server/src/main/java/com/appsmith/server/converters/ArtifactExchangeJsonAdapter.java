package com.appsmith.server.converters;

import com.appsmith.server.constants.ArtifactJsonType;
import com.appsmith.server.converters.ce.ArtifactExchangeJsonAdapterCE;
import com.appsmith.server.dtos.PackageJson;
import com.google.gson.Gson;
import org.springframework.stereotype.Component;

@Component
public class ArtifactExchangeJsonAdapter extends ArtifactExchangeJsonAdapterCE {

    public ArtifactExchangeJsonAdapter(Gson gson) {
        super(gson);
    }

    @Override
    protected void populateArtifactTypeRegistry() {
        super.populateArtifactTypeRegistry();
        this.artifactTypeRegistry.put(ArtifactJsonType.PACKAGE, PackageJson.class);
    }
}
