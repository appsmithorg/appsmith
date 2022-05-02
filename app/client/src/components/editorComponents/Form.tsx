// @ts-expect-error: redux-form import
import { Form } from "redux-form/dist/redux-form";
import styled from "styled-components";

const StyledForm = styled(Form)`
  width: 100%;
`;

export default StyledForm;
