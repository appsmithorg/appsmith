package com.external.constants;

public class ErrorMessages {

    public static final String EMPTY_ROW_OBJECT_MESSAGE = "Row Object cannot be empty. Please edit the Row Object field in the Google Sheet query form.";

    public static final String EMPTY_ROW_ARRAY_OBJECT_MESSAGE = "Row Object(s) cannot be empty. Please edit the Row Object(s) field in the Google Sheet query form.";

    public static final String EMPTY_UPDATE_ROW_OBJECT_MESSAGE = "Update Row Object cannot be empty. Please edit the Update Row Object field in the Google Sheet query form.";

    public static final String EMPTY_UPDATE_ROW_OBJECTS_MESSAGE = "Update Row Object(s) cannot be empty. Please edit the Update Row Object(s) field in the Google Sheet query form.";

    public static final String EXPECTED_ROW_OBJECT_MESSAGE = "Expected a row object. Please edit the Row Object field in the Google Sheet query form.";

    public static final String EXPECTED_ARRAY_OF_ROW_OBJECT_MESSAGE = "Expected an array of row object. Please edit the Row Object(s) field in the Google Sheet query form.";

    public static final String REQUEST_BODY_NOT_ARRAY = "Request body was not an array.";

    public static final String MISSING_GSHEETS_METHOD_ERROR_MSG = "Missing Google Sheets method.";

    public static final String UNSUCCESSFUL_RESPONSE_ERROR_MSG = "Appsmith server has received unsuccessful response from GoogleSheets. Please check the error details for more information.";

    public static final String QUERY_EXECUTION_FAILED_ERROR_MSG = "Error occurred while processing GoogleSheets query. To know more please check the error details.";

    public static final String MISSING_SPREADSHEET_URL_ERROR_MSG = "Missing required field Spreadsheet Url";

    public static final String MISSING_SPREADSHEET_NAME_ERROR_MSG = "Missing required field Spreadsheet Name";

    public static final String MISSING_CELL_RANGE_ERROR_MSG = "Missing required field 'Cell Range'";

    public static final String MISSING_SHEET_ID_ERROR_MSG = "Missing required field Sheet Id";

    public static final String MISSING_ROW_INDEX_ERROR_MSG = "Missing required field Row index";

    public static final String UNABLE_TO_CREATE_URI_ERROR_MSG = "Unable to create URI";

    public static final String MISSING_VALID_RESPONSE_ERROR_MSG = "Missing a valid response object.";

    public static final String EXPECTED_LIST_OF_ROW_OBJECTS_ERROR_MSG =  "Unable to parse request body. Expected a list of row objects.";

    public static final String INVALID_ROW_INDEX_ERROR_MSG = "Unexpected value for row index. Please use a number starting from 0";

    public static final String INVALID_TABLE_HEADER_INDEX = "Unexpected value for table header index. Please use a number starting from 1";

    public static final String RESPONSE_DATA_MAPPING_FAILED_ERROR_MSG = "Could not map response to existing data. Appsmith server has either received an empty response or an unexpected response.";

    public static final String UNKNOWN_SHEET_NAME_ERROR_MSG = "Unknown Sheet Name. Please make sure that the sheet exists before making further requests.";

    public static final String PARSING_FAILED_EXPECTED_A_ROW_OBJECT_ERROR_MSG = "Unable to parse request body. Expected a row object.";

    public static final String NULL_RESPONSE_BODY_ERROR_MSG = "Expected to receive a response body.";

    public static final String NO_DATA_FOUND_CURRENT_ROW_INDEX_ERROR_MSG = "No data found at this row index. Do you want to try inserting something first?";

    public static final String NOTHING_TO_UPDATE_ERROR_MSG = "Could not map to existing data. Nothing to update.";

    public static final String UNKNOWN_TRIGGER_METHOD_ERROR_MSG = "Unknown trigger method type: %s";

    public static final String UNKNOWN_EXECUTION_METHOD_ERROR_MSG = "Unknown execution method type: %s";

    public static final String EXPECTED_ROW_OBJECT_BUT_FOUND_ARRAY_ERROR_MSG = "Request body was an array. Expected a row object.";

    public static final String EXPECTED_EXISTING_HEADERS_IN_RESPONSE_ERROR_MSG = "Expected to receive a response of existing headers.";

    public static final String SPREADSHEET_ID_NOT_FOUND_IN_URL_ERROR_MSG = "Cannot read spreadsheet URL. Please verify that the provided the Spreadsheet URL matches this pattern https://docs.google.com/spreadsheets/d/spreadsheetId_should_be_here/.";

}
