/* Copyright 2019-2023 Appsmith */
package com.external.plugins.datatypes;

import com.appsmith.external.constants.DataType;
import com.appsmith.external.datatypes.AppsmithType;
import java.util.regex.Matcher;
import org.bson.BsonInvalidOperationException;
import org.bson.Document;
import org.bson.json.JsonParseException;

public class BsonType implements AppsmithType {

  @Override
  public boolean test(String s) {
    try {
      Document.parse(s);
      return true;
    } catch (JsonParseException | BsonInvalidOperationException e) {
      // Not BSON
    }
    return false;
  }

  @Override
  public String performSmartSubstitution(String s) {
    return Matcher.quoteReplacement(s);
  }

  @Override
  public DataType type() {
    return DataType.BSON;
  }
}
