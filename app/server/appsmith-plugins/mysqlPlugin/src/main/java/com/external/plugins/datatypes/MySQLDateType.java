package com.external.plugins.datatypes;

import com.appsmith.external.datatypes.DateType;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.time.format.DateTimeParseException;

public class MySQLDateType extends DateType {

    @Override
    public boolean test(String s) {
        try {
            final DateTimeFormatter dateFormatter = new DateTimeFormatterBuilder()
                    .appendOptional(DateTimeFormatter.ISO_LOCAL_DATE)
                    .appendOptional(DateTimeFormatter.BASIC_ISO_DATE)
                    .appendOptional(DateTimeFormatter.ofPattern("yyyy/MM/dd"))
                    .appendOptional(DateTimeFormatter.ofPattern("yyMMdd"))
                    .toFormatter();
            LocalDate.parse(s, dateFormatter);
            return true;
        } catch (DateTimeParseException ex) {
            // Not date
        }

        return false;
    }
}