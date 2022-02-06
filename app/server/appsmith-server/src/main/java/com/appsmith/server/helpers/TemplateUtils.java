package com.appsmith.server.helpers;

import com.github.mustachejava.DefaultMustacheFactory;
import com.github.mustachejava.Mustache;
import com.github.mustachejava.MustacheFactory;

import java.io.IOException;
import java.io.StringWriter;
import java.util.Map;

public class TemplateUtils {
    /**
     * This function replaces the variables in an email template to actual values. It uses the Mustache SDK.
     *
     * @param template The name of the template where the HTML text can be found
     * @param params   A Map of key-value pairs with the key being the variable in the template & value being the actual
     *                 value with which it must be replaced.
     * @return Template string with Mustache replacements applied.
     * @throws IOException bubbled from Mustache renderer.
     */
    public static String parseTemplate(String template, Map<String, ? extends Object> params) throws IOException {
        MustacheFactory mf = new DefaultMustacheFactory();
        StringWriter stringWriter = new StringWriter();
        Mustache mustache = mf.compile(template);
        mustache.execute(stringWriter, params).flush();
        return stringWriter.toString();
    }
}
