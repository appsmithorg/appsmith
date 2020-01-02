package com.appsmith.server.services;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Property;
import com.appsmith.server.domains.Action;
import com.appsmith.server.domains.Datasource;
import lombok.extern.slf4j.Slf4j;
import org.apache.http.NameValuePair;
import org.apache.http.client.utils.URLEncodedUtils;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URL;
import java.nio.charset.Charset;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * -X : Method
 * -H : Headers
 * -d : Body
 */

@Service
@Slf4j
public class CurlImporterService extends BaseApiImporter{

    private static final String headerRegex = "\\-H\\s+\\'(.+?)\\'";
    private static final String methodRegex = "\\-X\\s+(.+?)\\b";
    private static final String bodyRegex = "\\-d\\s+\\'(.+?)\\'";

    @Override
    public Action importAction(Object input) {
        String command = (String) input;
        Action action = new Action();
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        Datasource datasource = new Datasource();
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();

        // Matches : "-H 'headerKey:headerValue'
        Pattern headerPattern = Pattern.compile(headerRegex);
        Matcher headerMatcher = headerPattern.matcher(command);

        //Matches : "-X GET"
        Pattern methodPattern = Pattern.compile(methodRegex);
        Matcher methodMatcher = methodPattern.matcher(command);

        //Matches : "-d 'Message body string here'"
        Pattern bodyPattern = Pattern.compile(bodyRegex);
        Matcher bodyMatcher = bodyPattern.matcher(command);

        // Find all the headers here
        List<Property> headers = actionConfiguration.getHeaders();
        while (headerMatcher.find()) {
                String headerString = headerMatcher.group();
                String[] splitHeader = headerString.split("'");

                String header = splitHeader[1];
                String[] keyValuePairInString = header.split(":");

                Property property = new Property();
                property.setKey(keyValuePairInString[0]);
                property.setValue(keyValuePairInString[1]);

                if (headers == null) {
                    headers = new ArrayList<>();
                }
                
                headers.add(property);
        }
        actionConfiguration.setHeaders(headers);

        // Find the HTTP Method here
        if (methodMatcher.find()) {
            String methodString = methodMatcher.group(0);
            String[] method = methodString.split("\\s+");
            actionConfiguration.setHttpMethod(HttpMethod.valueOf(method[1]));
        }

        // If the body exists, find the body here
        if (bodyMatcher.find()) {
            String bodyString = bodyMatcher.group();
            String[] splitBody = bodyString.split("'");
            actionConfiguration.setBody(splitBody[1]);
        }

        String[] cmdSplit = command.split("\\s+");

        Boolean urlFound = false;
        // Find the URL now
        //Ignoring the first word which is "curl"
        for (int i = 1; i< cmdSplit.length; i++) {
            try {
                // If the string doesnt throw an exception when being converted to a URI, its a valid URL.
                URI uri = new URL(cmdSplit[i]).toURI();
                // If it reaches here, we have successfully found a valid URL.
                urlFound = true;
                //Extract query params
                List<NameValuePair> params = URLEncodedUtils.parse(uri, Charset.forName("UTF-8"));
                List<Property> queryParameters = actionConfiguration.getQueryParameters();
                if (queryParameters == null) {
                    queryParameters = new ArrayList<>();
                }
                for (NameValuePair param : params) {
                    Property queryParam = new Property();
                    queryParam.setKey(param.getName());
                    queryParam.setValue(param.getValue());
                    queryParameters.add(queryParam);
                }
                actionConfiguration.setQueryParameters(queryParameters);
                //Set the URL without the query params
                datasourceConfiguration.setUrl(cmdSplit[i].split("\\?")[0]);
            } catch (Exception e) {
                //Not a valid URL. Continue to the next word in the CURL command
            }

            //No need to continue to parse the curl string. We have found the URL. Move on.
            if (urlFound) {
                break;
            }
        }
        action.setActionConfiguration(actionConfiguration);
        datasource.setDatasourceConfiguration(datasourceConfiguration);
        action.setDatasource(datasource);
        return action;
    }
}
