package com.appsmith.external.converters;

import com.appsmith.external.constants.Authentication;
import com.appsmith.external.models.ApiKeyAuth;
import com.appsmith.external.models.AuthenticationDTO;
import com.appsmith.external.models.BasicAuth;
import com.appsmith.external.models.BearerTokenAuth;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.OAuth2;
import com.fasterxml.jackson.core.JacksonException;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.deser.std.StdDeserializer;
import org.json.JSONObject;

import java.io.IOException;

public class AuthenticationDtoDeserializer extends StdDeserializer<AuthenticationDTO> {

    protected AuthenticationDtoDeserializer(Class<?> vc) {
        super(vc);
    }

//    @Override
//    public AuthenticationDTO deserialize(JsonElement jsonElement, Type type, JsonDeserializationContext jsonDeserializationContext) throws JsonParseException {
//
//        if (jsonElement.isJsonNull()) {
//            return null;
//        }
//
//        JsonObject jsonObject = jsonElement.getAsJsonObject();
//        String authType = jsonObject.get("authenticationType").getAsString();
//
//        if (Authentication.DB_AUTH.equals(authType)) {
//            return jsonDeserializationContext.deserialize(jsonElement, DBAuth.class);
//        } else if (Authentication.OAUTH2.equals(authType)) {
//            return jsonDeserializationContext.deserialize(jsonElement, OAuth2.class);
//        } else if (Authentication.BASIC.equals(authType)) {
//            return jsonDeserializationContext.deserialize(jsonElement, BasicAuth.class);
//        } else if (Authentication.API_KEY.equals(authType)) {
//            return jsonDeserializationContext.deserialize(jsonElement, ApiKeyAuth.class);
//        } else if (Authentication.BEARER_TOKEN.equals(authType)) {
//            return jsonDeserializationContext.deserialize(jsonElement, BearerTokenAuth.class);
//        }
//
//        return null;
//    }

    @Override
    public AuthenticationDTO deserialize(JsonParser jsonParser, DeserializationContext deserializationContext) throws IOException, JacksonException {

        JSONObject jsonObject = new JSONObject(jsonParser.getText());
        String authType = jsonObject.getString("authenticationType");

        if (Authentication.DB_AUTH.equals(authType)) {
            return deserializationContext.readValue(jsonParser, DBAuth.class);
        } else if (Authentication.OAUTH2.equals(authType)) {
            return deserializationContext.readValue(jsonParser, OAuth2.class);
        } else if (Authentication.BASIC.equals(authType)) {
            return deserializationContext.readValue(jsonParser, BasicAuth.class);
        } else if (Authentication.API_KEY.equals(authType)) {
            return deserializationContext.readValue(jsonParser, ApiKeyAuth.class);
        } else if (Authentication.BEARER_TOKEN.equals(authType)) {
            return deserializationContext.readValue(jsonParser, BearerTokenAuth.class);
        }

        return null;
    }
}
