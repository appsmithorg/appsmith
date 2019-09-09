import React, { Component } from "react";
import styled from "styled-components";
// import { connect } from "react-redux";
// import { AppState } from "../../reducers";
// import { EditorHeaderReduxState } from "../../reducers/uiReducers/editorHeaderReducer";

const Header = styled.header`
  height: 50px;
  box-shadow: 0px 0px 3px #ccc;
  background: #fff;
`;

class EditorHeader extends Component {
  render() {
    return <Header></Header>;
  }
}

export default EditorHeader;

// const mapStateToProps = (
//   state: AppState,
//   props: any,
// ): EditorHeaderReduxState => {
//   return state;
// };

// const mapDispatchToProps = (dispatch: any) => {
//   return {};
// };

// export default connect(
//   mapStateToProps,
//   mapDispatchToProps,
// )(EditorHeader);
