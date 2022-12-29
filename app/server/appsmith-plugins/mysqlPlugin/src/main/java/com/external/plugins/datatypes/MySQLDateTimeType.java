package com.external.plugins.datatypes;

import com.appsmith.external.constants.DataType;
import com.appsmith.external.datatypes.AppsmithType;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import reactor.core.Exceptions;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.time.format.DateTimeParseException;
import java.util.regex.Matcher;

public class MySQLDateTimeType implements AppsmithType {
    private static final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public boolean test(String s) {
        try {
            final DateTimeFormatter dateTimeFormatter = new DateTimeFormatterBuilder()
                    .appendOptional(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))
                    .appendOptional(DateTimeFormatter.ISO_DATE_TIME)
                    .appendOptional(DateTimeFormatter.ofPattern("yyyy/MM/dd HH:mm:ss"))
                    .appendOptional(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"))
                    .appendOptional(DateTimeFormatter.ofPattern("yyMMddHHmmss"))
                    .toFormatter();
            LocalDateTime.parse(s, dateTimeFormatter);
            return true;
        } catch (DateTimeParseException ex) {
            // Not timestamp
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
        return DataType.TIMESTAMP;
    }
}
