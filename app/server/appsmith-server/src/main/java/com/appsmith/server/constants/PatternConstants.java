package com.appsmith.server.constants;

public class PatternConstants {
    public final static String WEBSITE_PATTERN = "^(http://|https://)?(www.)?(([a-z0-9\\-]+)\\.)+([a-z]+)$";
    public final static String EMAIL_PATTERN = "^(?=.{1,64}@)[A-Za-z0-9_-]+(\\.[A-Za-z0-9_-]+)*@"
            + "[^-][A-Za-z0-9-]+(\\.[A-Za-z0-9-]+)*(\\.[A-Za-z]{2,})$";
}
