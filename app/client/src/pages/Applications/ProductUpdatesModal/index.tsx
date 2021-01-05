import React from "react";
import Modal from "components/ads/Modal";
import { FeaturesLabel, BugFixesLabel } from "./Labels";

const ProductUpdatesModal = () => {
  return (
    <Modal
      trigger={<div>form modal</div>}
      // Form={props.add.form}
      title={"Product Updates"}
      width={580}
      maxHeight={"80vh"}
    >
      <div style={{ height: 1000 }}>contents</div>
      <FeaturesLabel />
      <BugFixesLabel />
    </Modal>
  );
};

export default ProductUpdatesModal;
