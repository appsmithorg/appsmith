package com.appsmith.server.converters.ce;

import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.ArtifactExchangeJson;
import com.google.gson.Gson;
import com.google.gson.JsonDeserializationContext;
import com.google.gson.JsonDeserializer;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParseException;

import java.lang.reflect.Type;
import java.util.HashMap;
import java.util.Map;

public class ArtifactExchangeJsonAdapterCE implements JsonDeserializer<ArtifactExchangeJson> {
    private static final String FIELD_NAME = "artifactJsonType";
    protected Map<ArtifactType, Class<? extends ArtifactExchangeJson>> artifactTypeRegistry;
    private final Gson gson;

    public ArtifactExchangeJsonAdapterCE(Gson gson) {
        this.gson = gson;
        populateArtifactTypeRegistry();
    }

    protected void populateArtifactTypeRegistry() {
        this.artifactTypeRegistry = new HashMap<>();
        this.artifactTypeRegistry.put(ArtifactType.APPLICATION, ApplicationJson.class);
    }

    @Override
    public ArtifactExchangeJson deserialize(JsonElement json, Type typeOfT, JsonDeserializationContext context)
            throws JsonParseException {
        JsonObject jsonObject = json.getAsJsonObject();
        JsonElement artifactJsonTypeElement = jsonObject.get(FIELD_NAME);
        Class<? extends ArtifactExchangeJson> instanceClass = ApplicationJson.class;
        if (artifactJsonTypeElement != null) {
            ArtifactType artifactType = ArtifactType.valueOf(artifactJsonTypeElement.getAsString());
            instanceClass = artifactTypeRegistry.getOrDefault(artifactType, ApplicationJson.class);
        }
        return gson.fromJson(json, instanceClass);
    }
}
