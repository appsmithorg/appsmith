package com.appsmith.external.helpers;

import com.google.common.base.Ascii;
import org.apache.commons.validator.routines.DateValidator;
import org.bson.types.Binary;

import java.io.UnsupportedEncodingException;
import java.nio.charset.StandardCharsets;
import java.sql.Date;
import java.sql.Time;
import java.text.DateFormat;
import java.text.ParseException;
import java.text.SimpleDateFormat;

public class SqlStringUtils {

    public static class DateValidatorUsingDateFormat extends DateValidator {
        private String dateFormat;

        public DateValidatorUsingDateFormat(String dateFormat) {
            this.dateFormat = dateFormat;
        }

        @Override
        public boolean isValid(String dateStr) {
            DateFormat sdf = new SimpleDateFormat(this.dateFormat);
            sdf.setLenient(false);
            try {
                sdf.parse(dateStr);
            } catch (ParseException e) {
                return false;
            }
            return true;
        }
    }

    public static Class stringToKnownDataTypeConverter(String input) {

        if (isBinary(input)) {
            return Binary.class;
        }

        try
        {
            input.getBytes("UTF-8");
            return Byte.class;
        } catch (UnsupportedEncodingException e) {
            // Not byte
        }

        try {
            Integer.parseInt(input);
            return Integer.class;
        } catch (NumberFormatException e) {
            // Not an integer
        }

        try {
            Long.parseLong(input);
            return Long.class;
        } catch (NumberFormatException e1) {
            // Not long
        }

        try {
            Float.parseFloat(input);
            return Float.class;
        } catch (NumberFormatException e2) {
            // Not float
        }

        try {
            Double.parseDouble(input);
            return Double.class;
        } catch (NumberFormatException e3) {
            // Not double
        }

        String copyInput = String.valueOf(input).toLowerCase().trim();
        if (copyInput.equals("true") || copyInput.equals("false")) {
            return Boolean.class;
        }

        if (copyInput.equals("null")) {
            return null;
        }

        java.sql.Time.valueOf("input");

        DateValidator dateValidator = new DateValidatorUsingDateFormat("yyyy-mm-dd");
        if (dateValidator.isValid(input)) {
            return Date.class;
        }

        DateValidator dateTimeValidator = new DateValidatorUsingDateFormat("yyyy-mm-dd hh:mm:ss");
        if (dateTimeValidator.isValid(input)) {
            return Date.class;
        }

        DateValidator timeValidator = new DateValidatorUsingDateFormat("hh:mm:ss");
        if (timeValidator.isValid(input)) {
            return Time.class;
        }

        /**
         * TODO : Timestamp
         */

        // Check if unicode stream also gets handled as part of this since the destination SQL type is the same.
        if(StandardCharsets.US_ASCII.newEncoder().canEncode(input)) {
            return Ascii.class;
        }



        return String.class;
    }

    private static boolean isBinary(String input) {
        for(int i = 0; i < input.length(); i++) {
            int tempB = input.charAt(i);
            if (tempB == '0' || tempB == '1') {
                continue;
            }
            return false;
        }
        // no failures, so
        return true;
    }
}
