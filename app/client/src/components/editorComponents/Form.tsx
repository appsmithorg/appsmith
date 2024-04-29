import { Form } from "redux-form";
import styled from "styled-components";

const StyledForm = styled(Form)`
  display: flex;
  flex-direction: column;
  gap: 12px;
  .bp3-form-group {
    margin: 0;
  }
`;

export default StyledForm;
