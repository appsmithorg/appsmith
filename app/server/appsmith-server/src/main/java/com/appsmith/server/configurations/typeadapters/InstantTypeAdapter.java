package com.appsmith.server.configurations.typeadapters;

import com.google.gson.TypeAdapter;
import com.google.gson.stream.JsonReader;
import com.google.gson.stream.JsonWriter;

import java.io.IOException;
import java.time.Instant;

public class InstantTypeAdapter extends TypeAdapter<Instant> {
    @Override
    public void write(JsonWriter jsonWriter, Instant instant) throws IOException {
        jsonWriter.jsonValue(instant.toString());
    }

    @Override
    public Instant read(JsonReader jsonReader) throws IOException {
        String ldtString = jsonReader.nextString();
        return Instant.parse(ldtString);
    }
}
