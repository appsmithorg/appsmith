import React, { useRef, useState } from "react";
import {
  ToolbarButtons,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@appsmith/wds";
// Since the Modal is rendered at the root of the Provider, we need to add Unstyled as a wrapper
// so that Storybook does not break styles.
import { Unstyled } from "@storybook/blocks";

const fakeSubmit = async () => {
  return new Promise<void>((resolve) =>
    setTimeout(() => {
      alert("Submitted");
      resolve();
    }, 500),
  );
};

export const ModalExamples = () => {
  const [isSmallOpen, setSmallOpen] = useState(false);
  const [isMediumOpen, setMediumOpen] = useState(false);
  const [isLargeOpen, setLargeOpen] = useState(false);
  const smallRef = useRef(null);
  const mediumRef = useRef(null);
  const largeRef = useRef(null);

  return (
    <>
      <ToolbarButtons
        items={[
          { id: "small", label: "Small" },
          { id: "medium", label: "Medium" },
          { id: "large", label: "Large" },
        ]}
        onAction={(key) => {
          if (key === "small") {
            setSmallOpen(!isSmallOpen);
          }

          if (key === "medium") {
            setMediumOpen(!isMediumOpen);
          }

          if (key === "large") {
            setLargeOpen(!isLargeOpen);
          }
        }}
      />
      <Modal
        initialFocus={2}
        isOpen={isLargeOpen}
        setOpen={setLargeOpen}
        size="large"
        triggerRef={largeRef}
      >
        <Unstyled>
          <ModalContent>
            <ModalHeader title="Large modal title" />
            <ModalBody>
              Lorem ipsum dolor sit amet, consectetur adipisicing elit. Aut ex
              illo ipsa iste mollitia non nulla qui, sed. Amet aperiam
              aspernatur at autem beatae blanditiis commodi, cum delectus
              dignissimos ea enim ex hic illum ipsam ipsum iure iusto magnam
              mollitia nobis nulla odit pariatur possimus praesentium quaerat
              quia quo repellat repellendus sequi similique soluta sunt tempora
              tempore temporibus? Accusamus accusantium ad cumque deserunt
              dolorum enim error, excepturi exercitationem facere fugiat impedit
              in ipsum labore laboriosam minus modi mollitia neque nulla
              officiis porro, quo quos, sapiente totam veritatis vitae voluptas
              voluptatibus? Aliquid amet asperiores aut exercitationem facilis
              ipsa itaque magni nam odio reiciendis repellendus rerum tempore
              ullam, vero voluptatem! Animi cupiditate et minus porro
              recusandae, temporibus tenetur! Aliquid aperiam aspernatur beatae
              dolore eius ex exercitationem expedita fuga iste iusto laboriosam
              laudantium modi necessitatibus nemo nulla odio optio perferendis,
              placeat praesentium quae quidem rem rerum soluta tempore tenetur
              unde velit voluptas? At consequuntur corporis delectus earum eos
              nihil odio officiis, quae quis sed. Asperiores excepturi hic
              molestiae nesciunt nostrum quae temporibus. Commodi corporis eos
              illo, ipsum laboriosam molestias neque numquam rerum veniam
              veritatis. Doloribus impedit iste nulla quia. Assumenda et facilis
              id minima praesentium quaerat similique. Ad adipisci assumenda aut
              blanditiis dicta dignissimos eligendi ipsa mollitia natus nobis,
              obcaecati possimus quam quia recusandae repellat sed sit veniam.
              Animi consectetur libero praesentium temporibus velit! Amet atque
              culpa, debitis deleniti eius harum libero maxime odit officia
              officiis quibusdam, repellat sunt tempora? Accusantium atque,
              cumque doloribus eveniet laudantium magni molestias officia, sequi
              temporibus vel velit veritatis vero voluptatibus! Consequuntur
              delectus eaque minus obcaecati repellat repudiandae sapiente,
              tempora unde. Ab ad autem beatae commodi, culpa cupiditate debitis
              dolores doloribus earum eos eveniet ex excepturi expedita
              explicabo fuga incidunt inventore maxime minus modi molestias
              nulla odio, perspiciatis quam quisquam quo ratione sapiente
              voluptatem? Autem inventore quae velit.
            </ModalBody>
            <ModalFooter onSubmit={fakeSubmit} />
          </ModalContent>
        </Unstyled>
      </Modal>
      <Modal
        initialFocus={2}
        isOpen={isMediumOpen}
        setOpen={setMediumOpen}
        triggerRef={mediumRef}
      >
        <Unstyled>
          <ModalContent>
            <ModalHeader title="Medium modal title" />
            <ModalBody>
              Lorem ipsum dolor sit amet, consectetur adipisicing elit. Alias
              amet animi corporis laboriosam libero voluptas! A, reiciendis,
              veniam?
            </ModalBody>
            <ModalFooter onSubmit={fakeSubmit} />
          </ModalContent>
        </Unstyled>
      </Modal>
      <Modal
        initialFocus={2}
        isOpen={isSmallOpen}
        setOpen={setSmallOpen}
        size="small"
        triggerRef={smallRef}
      >
        <Unstyled>
          <ModalContent>
            <ModalHeader title="Small modal title" />
            <ModalBody>
              Lorem ipsum dolor sit amet, consectetur adipisicing elit. Alias
              amet animi corporis laboriosam libero voluptas! A, reiciendis,
              veniam?
            </ModalBody>
            <ModalFooter onSubmit={fakeSubmit} />
          </ModalContent>
        </Unstyled>
      </Modal>
    </>
  );
};
