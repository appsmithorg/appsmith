package models

type (
	Query struct {
		ID              int64  `json:"id" sql:"id"`
		Name            string `json:"name" sql:"name"`
		QueryType       string `json:"query_type,omitempty" sql:"query_type"`
		Executable      string `json:"executable,omitempty" sql:"executable"`
		ResourceName    string `json:"resource_name,omitempty" sql:"resource_name"`
		ConfirmationMsg string `json:"confirmation_msg,omitempty" sql:"confirmation_msg"`
	}

	ExecQuery struct {
		QueryType string `json:"query_type,omitempty"`
		Name      string `json:"name"`
		Params    Params `json:"params,omitempty"`
	}

	Params struct {
		QueryParams  []KeyValue `json:"query_params,omitempty"`
		HeaderParams []KeyValue `json:"header_params,omitempty"`
		CookieParams []KeyValue `json:"cookie_params,omitempty"`
	}

	KeyValue struct {
		Key   string `json:"key"`
		Value string `json:"value"`
	}
)
