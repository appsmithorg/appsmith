package com.appsmith.server.converters;

import com.appsmith.server.converters.ce.ArtifactExchangeJsonAdapterCE;
import com.google.gson.Gson;
import org.springframework.stereotype.Component;

@Component
public class ArtifactExchangeJsonAdapter extends ArtifactExchangeJsonAdapterCE {

    public ArtifactExchangeJsonAdapter(Gson gson) {
        super(gson);
    }
}
