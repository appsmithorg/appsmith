package com.appsmith.external.datatypes;

import com.appsmith.external.constants.DataType;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import reactor.core.Exceptions;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.time.format.DateTimeParseException;
import java.util.regex.Matcher;

public class DateType implements AppsmithType {

    private static final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public boolean test(String s) {
        try {
            final DateTimeFormatter dateFormatter = new DateTimeFormatterBuilder()
                    .appendOptional(DateTimeFormatter.ISO_LOCAL_DATE)
                    .toFormatter();
            LocalDate.parse(s, dateFormatter);
            return true;
        } catch (DateTimeParseException ex) {
            // Not date
        }

        return false;
    }

    @Override
    public String performSmartSubstitution(String s) {
        try {
            String valueAsString = objectMapper.writeValueAsString(s);
            return Matcher.quoteReplacement(valueAsString);
        } catch (JsonProcessingException e) {
            throw Exceptions.propagate(
                    new AppsmithPluginException(
                            AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                            s,
                            e.getMessage()
                    )
            );
        }
    }

    @Override
    public DataType type() {
        return DataType.DATE;
    }
}