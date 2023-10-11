package com.appsmith.server.constants;

public class PatternConstants {

    /**
     * Valid Website Patterns:
     * - https://www.valid.website.com
     * - http://www.valid.website.com
     * - https://valid.website.com
     * - http://valid.website.com
     * - www.valid.website.com
     * - valid.website.com
     * - valid-website.com
     * - valid.12345.com
     * - 12345.com
     * <p>
     * Invalid Website Patterns:
     * - htp://www.invalid.website.com
     * - htp://invalid.website.com
     * - htp://www
     * - www
     * - www.
     */
    public static final String WEBSITE_PATTERN = "^(http://|https://)?(www.)?(([a-z0-9\\-]+)\\.)+([a-z]+)(/)?$";
    /**
     * Valid Email Patterns:
     * - valid@email.com
     * - valid@email.co.in
     * - valid@email-assoc.co.in
     * Invalid Email Patterns:
     * - invalid@.com
     * - @invalid.com
     */
    public static final String EMAIL_PATTERN = "^(?=.{1,64}@)[A-Za-z0-9_-]+(\\.[A-Za-z0-9_-]+)*@"
            + "[^-][A-Za-z0-9-]+(\\.[A-Za-z0-9-]+)*(\\.[A-Za-z]{2,})$";
}
