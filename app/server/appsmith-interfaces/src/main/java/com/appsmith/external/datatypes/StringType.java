/* Copyright 2019-2023 Appsmith */
package com.appsmith.external.datatypes;

import com.appsmith.external.constants.DataType;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.regex.Matcher;
import reactor.core.Exceptions;

public class StringType implements AppsmithType {

  private static final ObjectMapper objectMapper = new ObjectMapper();

  @Override
  public boolean test(String s) {
    return true;
  }

  @Override
  public String performSmartSubstitution(String s) {
    try {
      String valueAsString = objectMapper.writeValueAsString(s);
      return Matcher.quoteReplacement(valueAsString);
    } catch (JsonProcessingException e) {
      throw Exceptions.propagate(
          new AppsmithPluginException(
              AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR, s, e.getMessage()));
    }
  }

  @Override
  public DataType type() {
    return DataType.STRING;
  }
}
