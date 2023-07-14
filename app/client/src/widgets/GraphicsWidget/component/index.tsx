import React, { Suspense, useEffect, useRef } from "react";
import {
  OrbitControls,
  useAnimations,
  useGLTF,
  useTexture,
} from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Html, useProgress } from "@react-three/drei";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { MeshStandardMaterial } from "three";
function Loader() {
  const { progress } = useProgress();
  return <Html center>{progress} % loaded</Html>;
}
const path = "/static/final_fight_arcade.glb";
export function ThreeJSScene(props: any) {
  const [Board_Sticker_baseColor, Board_Sticker_metallicRoughness] = useTexture(
    [
      "/static/textures/Board_Sticker_baseColor.jpeg",
      "/static/textures/Board_Sticker_metallicRoughness.png",
    ],
  );
  const all = useGLTF(path);
  const { nodes, materials, parser } = all;
  useEffect(() => {
    parser.getDependencies("texture");
  }, []);
  return (
    <group {...props} dispose={null}>
      <group rotation={[-Math.PI / 2, 0, 0]} scale={[0.002, 0.002, 0.002]}>
        <group rotation={[Math.PI / 2, 0, 0]}>
          <group position={[49, 392.765, 155]}>
            <mesh
              castShadow
              receiveShadow
              geometry={nodes.Stick_1_Rubber_0.geometry}
              material={materials.Rubber}
            />
            <meshStandardMaterial
              metalnessMap={materials.Rubber.metalnessMap}
              roughnessMap={materials.Rubber.roughnessMap}
              map={materials.Rubber.map}
              normalMap={materials.Rubber.normalMap}
            />
            <mesh
              castShadow
              receiveShadow
              geometry={nodes["Stick_1_Silver_-_High_Reflection_0"].geometry}
              material={materials["Silver_-_High_Reflection"]}
            />
          </group>
          <group position={[-114, 392.765, 155]}>
            <mesh
              castShadow
              receiveShadow
              geometry={nodes.Stick_Rubber_0.geometry}
              material={materials.Rubber}
            />

            <mesh
              castShadow
              receiveShadow
              geometry={nodes["Stick_Silver_-_High_Reflection_0"].geometry}
              material={materials["Silver_-_High_Reflection"]}
            />
          </group>
          <group position={[0, 387.75, 140]}>
            <mesh
              castShadow
              receiveShadow
              geometry={nodes.Board_Blue_Light_0.geometry}
              material={materials.Blue_Light}
            />

            <mesh
              castShadow
              receiveShadow
              geometry={nodes.Board_Black_Plastic_0.geometry}
              material={materials.Black_Plastic}
            />
            <mesh
              castShadow
              receiveShadow
              geometry={nodes.Board_Board_Sticker_0.geometry}
              material={materials.Board_Sticker}
            >
              <meshStandardMaterial
                metalnessMap={materials.Board_Sticker.metalnessMap}
                map={materials.Board_Sticker.map}
                roughnessMap={materials.Board_Sticker.roughnessMap}
              />
            </mesh>
          </group>
          <group position={[0, 692.985, 8.638]}>
            <mesh
              castShadow
              receiveShadow
              geometry={nodes.Body_Top_Sticker_0.geometry}
              material={materials.Top_Sticker}
            />
            <meshStandardMaterial
              map={materials.Top_Sticker.map}
              normalMap={materials.Top_Sticker.normalMap}
              roughnessMap={materials.Top_Sticker.roughnessMap}
              metalnessMap={materials.Top_Sticker.metalnessMap}
            />
            <mesh
              castShadow
              receiveShadow
              geometry={nodes.Body_Black_Plastic1_0.geometry}
              material={materials["Black_Plastic.1"]}
            />
            <mesh
              castShadow
              receiveShadow
              geometry={nodes.Body_Screen_0.geometry}
              material={materials.Screen}
            />
            <mesh
              castShadow
              receiveShadow
              geometry={nodes.Body_Screen_Sticker_0.geometry}
              material={materials.Screen_Sticker}
            />
          </group>
          <group
            position={[-156, 377.911, -36]}
            rotation={[0, -Math.PI / 2, 0]}
          >
            <mesh
              castShadow
              receiveShadow
              geometry={nodes.Side_Sticker_Side_Sticker_0.geometry}
              material={materials.Side_Sticker}
            />

            <mesh
              castShadow
              receiveShadow
              geometry={nodes.Side_Sticker_Blue_Light_0.geometry}
              material={materials.Blue_Light}
            />
          </group>
          <group position={[-150, 377.015, 25.583]}>
            <mesh
              castShadow
              receiveShadow
              geometry={nodes.Side_Left_Side_Sticker_0.geometry}
              material={materials.Side_Sticker_0}
            />

            <mesh
              castShadow
              receiveShadow
              geometry={nodes.Side_Left_Yellow_Light_0.geometry}
              material={materials.Yellow_Light}
            />
          </group>
          <group position={[156, 377.911, -36]} rotation={[0, Math.PI / 2, 0]}>
            <mesh
              castShadow
              receiveShadow
              geometry={nodes.Side_Sticker_Right_Side_Sticker_0.geometry}
              material={materials.Side_Sticker}
            />

            <mesh
              castShadow
              receiveShadow
              geometry={nodes.Side_Sticker_Right_Blue_Light_0.geometry}
              material={materials.Blue_Light}
            />
          </group>
          <group position={[150, 377.015, 25.583]}>
            <mesh
              castShadow
              receiveShadow
              geometry={nodes.Side_Right_Side_Sticker1_0.geometry}
              material={materials["Side_Sticker.1"]}
            />

            <mesh
              castShadow
              receiveShadow
              geometry={nodes.Side_Right_Yellow_Light_0.geometry}
              material={materials.Yellow_Light}
            />
          </group>
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Coin_1_Red_Btn_0.geometry}
            material={materials.Red_Btn}
            position={[16, 239.015, 158]}
          />

          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Coin_Red_Btn_0.geometry}
            material={materials.Red_Btn}
            position={[-16, 239.015, 158]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Attack_2_Red_Btn_0.geometry}
            material={materials.Red_Btn}
            position={[89, 392.765, 155]}
          />

          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Jump_2_Blue_Btn_0.geometry}
            material={materials.Blue_Btn}
            position={[115, 392.765, 155]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Start_White_Btn_0.geometry}
            material={materials.White_Btn}
            position={[-14, 392.765, 86]}
          />

          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Select_White_Btn_0.geometry}
            material={materials.White_Btn}
            position={[14, 392.765, 86]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Jump_Blue_Btn_0.geometry}
            material={materials.Blue_Btn}
            position={[-48, 392.765, 155]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Attack_Red_Btn_0.geometry}
            material={materials.Red_Btn}
            position={[-74, 392.765, 155]}
          />

          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Panel_Rubber2_0.geometry}
            material={materials["Rubber.2"]}
            position={[0, 211.015, 154]}
          />
        </group>
      </group>
    </group>
  );
}
useGLTF.preload(path);
function GraphicsComponent(props: GraphicsComponentProps) {
  return (
    <div style={{ height: "100%", width: "100%" }}>
      <Canvas>
        <OrbitControls enableDamping enablePan enableRotate enableZoom />
        <Suspense fallback={<Loader />}>
          <ThreeJSScene />
        </Suspense>
      </Canvas>
    </div>
  );
}

export interface GraphicsComponentProps {
  id: string;
}

export default GraphicsComponent;
