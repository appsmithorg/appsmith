package com.appsmith.server.constants;

public class ApplicationConstants {
    public static final String[] APP_CARD_COLORS = {
        "#FFDEDE", "#FFEFDB", "#F3F1C7", "#F4FFDE", "#C7F3F0", "#D9E7FF", "#E3DEFF", "#F1DEFF", "#C7F3E3", "#F5D1D1",
        "#ECECEC", "#FBF4ED", "#D6D1F2", "#FFEBFB", "#EAEDFB"
    };

    /**
     *  Appsmith provides xmlParser v 3.17.5 and few other customJSLibraries by default, xmlParser has been
     *  flagged because it has some vulnerabilities. Appsmith is stopping natively providing support for xmlParser.
     *  This however, would break existing applications which are using xmlParser. In order to prevent this,
     *  we are adding xmlParser as an add-onn to all existing applications and applications which will be imported
     *  This CustomJSLib UID needs to be added to all the imported applications where we don't have any later versions of xmlParser present.
     */
    public static final String XML_PARSER_LIBRARY_UID =
            "parser_https://cdnjs.cloudflare.com/ajax/libs/fast-xml-parser/3.17.5/parser.min.js";
}
