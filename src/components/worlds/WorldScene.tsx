"use client";

import {
  Component,
  Suspense,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Image from "next/image";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  Instance,
  Instances,
  OrbitControls,
  RoundedBox,
  useProgress,
  useTexture,
} from "@react-three/drei";
import { Color, Group, MathUtils, ShaderMaterial, type Texture } from "three";
import { ArcReactor } from "./ArcReactor";

type SceneProps = {
  kind: "studio" | "desktop";
  exploded?: boolean;
  rotation?: number;
  motion: boolean;
  onInteract: () => void;
};
const sceneCamera = {
  position: [6.4, 4.9, 8.6] as [number, number, number],
  fov: 34,
};

function CameraPlacement({ kind }: { kind: SceneProps["kind"] }) {
  const camera = useThree((state) => state.camera);
  const invalidate = useThree((state) => state.invalidate);
  useLayoutEffect(() => {
    if (kind === "studio") camera.position.set(6.4, 4.9, 8.6);
    else camera.position.set(4.3, 2.2, 7.6);
    camera.lookAt(0, 0, 0);
    invalidate();
  }, [kind, camera, invalidate]);
  return null;
}

function ContentReady({ onReady }: { onReady: (ready: boolean) => void }) {
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    let second = 0;
    const first = requestAnimationFrame(() => {
      invalidate();
      second = requestAnimationFrame(() => onReady(true));
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, [invalidate, onReady]);
  return null;
}

function Penguin() {
  return (
    <group
      position={[2, -0.65, 1.15]}
      scale={0.48}
      rotation={[0, -0.23, -0.07]}
    >
      <mesh position={[0, 0.63, 0]} scale={[0.69, 0.95, 0.64]}>
        <sphereGeometry args={[1, 28, 24]} />
        <meshStandardMaterial color="#1b2528" roughness={0.34} />
      </mesh>
      <mesh position={[0, 0.42, 0.47]} scale={[0.48, 0.64, 0.24]}>
        <sphereGeometry args={[1, 24, 20]} />
        <meshStandardMaterial color="#fff4d9" roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.35, 0.06]} scale={[0.55, 0.55, 0.52]}>
        <sphereGeometry args={[1, 28, 24]} />
        <meshStandardMaterial color="#1b2528" roughness={0.35} />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh position={[side * 0.21, 1.47, 0.5]} scale={[0.16, 0.2, 0.06]}>
            <sphereGeometry args={[1, 20, 16]} />
            <meshStandardMaterial color="#fff8e9" />
          </mesh>
          <mesh
            position={[side * 0.205, 1.47, 0.556]}
            scale={[0.055, 0.08, 0.03]}
          >
            <sphereGeometry args={[1, 16, 12]} />
            <meshStandardMaterial color="#213230" />
          </mesh>
          <mesh
            position={[side * 0.35, -0.17, 0.24]}
            scale={[0.33, 0.12, 0.48]}
            rotation={[0, side * -0.23, 0]}
          >
            <sphereGeometry args={[1, 20, 16]} />
            <meshStandardMaterial color="#f5b446" roughness={0.5} />
          </mesh>
          <mesh
            position={[side * 0.63, 0.5, 0]}
            scale={[0.18, 0.6, 0.32]}
            rotation={[0, 0, side * 0.2]}
          >
            <sphereGeometry args={[1, 20, 16]} />
            <meshStandardMaterial color="#1b2528" roughness={0.4} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 1.23, 0.59]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.21, 0.39, 24]} />
        <meshStandardMaterial color="#f2b040" roughness={0.42} />
      </mesh>
    </group>
  );
}

function Computer({ kind, motion, rotation = 0, onInteract }: SceneProps) {
  const ref = useRef<Group>(null);
  const screen = useTexture("/3d/crt-screen.svg");
  const material = useRef<ShaderMaterial>(null);
  const [uniforms] = useState(() => ({
    screen: { value: screen as Texture },
    time: { value: 0 },
  }));
  useFrame(({ pointer, clock }, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y = motion
      ? MathUtils.damp(
          ref.current.rotation.y,
          -0.35 + rotation + pointer.x * 0.09,
          3,
          Math.min(delta, 0.05),
        )
      : -0.35 + rotation;
    if (material.current && motion)
      material.current.uniforms.time.value = clock.elapsedTime;
  });
  return (
    <group ref={ref} rotation={[0.04, -0.35, 0.02]} position={[-0.3, 0.25, 0]}>
      <group
        onClick={(event) => {
          if (kind !== "desktop") return;
          event.stopPropagation();
          onInteract();
        }}
      >
        <RoundedBox
          args={[2.7, 2.12, 1.67]}
          radius={0.23}
          smoothness={5}
          castShadow
        >
          <meshStandardMaterial
            color="#d6cbbc"
            roughness={0.53}
            metalness={0.08}
          />
        </RoundedBox>
        <RoundedBox
          args={[2.41, 1.77, 0.16]}
          position={[0, 0.03, 0.84]}
          radius={0.18}
          smoothness={5}
        >
          <meshStandardMaterial color="#726b60" roughness={0.65} />
        </RoundedBox>
        <RoundedBox
          args={[2.23, 1.61, 0.07]}
          position={[0, 0.05, 0.943]}
          radius={0.17}
          smoothness={5}
        >
          <meshStandardMaterial color="#132e2a" roughness={0.3} />
        </RoundedBox>
        <mesh position={[0, 0.05, 0.985]}>
          <planeGeometry args={[2.14, 1.52]} />
          <shaderMaterial
            ref={material}
            uniforms={uniforms}
            vertexShader="varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}"
            fragmentShader="uniform sampler2D screen; uniform float time; varying vec2 vUv; void main(){vec2 p=vUv-.5;vec2 uv=p*(1.+.1*dot(p,p))+.5;vec3 color=texture2D(screen,uv).rgb;float scan=.91+.09*sin(uv.y*700.);float vignette=1.-.5*dot(p,p);gl_FragColor=vec4(color*scan*vignette,1.);}"
          />
        </mesh>
        <mesh position={[1.03, -0.91, 0.825]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.049, 0.049, 0.045, 16]} />
          <meshStandardMaterial
            color="#ffad5c"
            emissive="#ff8a36"
            emissiveIntensity={0.6}
          />
        </mesh>
        <RoundedBox
          args={[0.8, 0.25, 0.7]}
          radius={0.08}
          position={[0, -1.16, -0.2]}
        >
          <meshStandardMaterial color="#b7ad9e" roughness={0.6} />
        </RoundedBox>
        <RoundedBox
          args={[1.6, 0.14, 1.2]}
          radius={0.15}
          position={[0, -1.33, -0.12]}
        >
          <meshStandardMaterial color="#d7cdbc" roughness={0.58} />
        </RoundedBox>
      </group>
      <group position={[0, -1.34, 1.43]} rotation={[0.11, 0, 0]}>
        <RoundedBox args={[2.78, 0.16, 1.02]} radius={0.08} castShadow>
          <meshStandardMaterial color="#d7cbbc" roughness={0.58} />
        </RoundedBox>
        <Instances limit={52}>
          <boxGeometry args={[0.148, 0.09, 0.155]} />
          <meshStandardMaterial color="#f7ecd7" roughness={0.48} />
          {Array.from({ length: 52 }, (_, i) => (
            <Instance
              key={i}
              position={[
                -1.13 + (i % 13) * 0.182,
                0.115,
                -0.33 + Math.floor(i / 13) * 0.192,
              ]}
            />
          ))}
        </Instances>
        <RoundedBox
          args={[0.9, 0.09, 0.13]}
          radius={0.025}
          position={[0, 0.14, 0.4]}
        >
          <meshStandardMaterial color="#a89c8b" roughness={0.6} />
        </RoundedBox>
      </group>
      <group position={[-2.05, -1.25, 1.3]} rotation={[0, 0.2, 0]}>
        {["#d9986b", "#7d9f9a", "#ddbd76"].map((color, i) => (
          <group
            key={color}
            position={[i * 0.045, i * 0.1, -i * 0.04]}
            rotation={[0, i * 0.15, 0]}
          >
            <RoundedBox args={[0.72, 0.09, 0.76]} radius={0.04}>
              <meshStandardMaterial color={color} roughness={0.7} />
            </RoundedBox>
            <mesh position={[0, 0.051, 0.02]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.47, 0.37]} />
              <meshStandardMaterial color="#eee9d7" />
            </mesh>
          </group>
        ))}
      </group>
      <Penguin />
    </group>
  );
}

function Fallback({ kind }: { kind: SceneProps["kind"] }) {
  return (
    <div className={`scene-fallback ${kind}`}>
      <Image
        unoptimized
        src={`/3d/${kind}-poster.webp`}
        width={900}
        height={720}
        alt=""
      />
      <p>
        Static preview. Interactive 3D is unavailable.
        <br />
        Every project and section is still accessible.
      </p>
    </div>
  );
}

class SceneBoundary extends Component<
  { children: ReactNode; kind: SceneProps["kind"]; onFail: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onFail();
  }
  render() {
    return this.state.failed ? (
      <Fallback kind={this.props.kind} />
    ) : (
      this.props.children
    );
  }
}

function Loader({ ready }: { ready: boolean }) {
  const { active, progress } = useProgress();
  return active || !ready ? (
    <div className="scene-loading" role="status">
      {active ? "Loading the scene" : "Preparing 3D"}
      {active && <span>{Math.round(progress)}%</span>}
    </div>
  ) : null;
}

export default function WorldScene(props: SceneProps) {
  const wrapper = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const [ready, setReady] = useState(false);
  const [lost, setLost] = useState(false);
  const [supported] = useState(() => {
    try {
      const context = document.createElement("canvas").getContext("webgl2");
      context?.getExtension("WEBGL_lose_context")?.loseContext();
      return Boolean(context);
    } catch {
      return false;
    }
  });
  const [coarse] = useState(
    () => window.matchMedia("(pointer: coarse)").matches,
  );
  useEffect(() => {
    if (!wrapper.current) return;
    const observer = new IntersectionObserver(([entry]) =>
      setVisible(entry.isIntersecting),
    );
    observer.observe(wrapper.current);
    return () => observer.disconnect();
  }, []);
  const studio = props.kind === "studio";
  return (
    <div
      className={`world-scene ${props.kind}-scene`}
      ref={wrapper}
      data-scene-ready={ready}
      data-webgl={supported && !lost ? "available" : "unavailable"}
      role="img"
      aria-label={
        studio
          ? "Arc reactor with copper coils and an illuminated core"
          : "Retro computer and Linux penguin sculpture"
      }
      aria-describedby={studio ? "reactor-description" : undefined}
    >
      {studio && (
        <span id="reactor-description" className="sr-only">
          Five separable layers: containment housing, copper induction coils,
          palladium core, optical shield, and locking bezel. Use the assembly
          and rotation controls to inspect the reactor.
        </span>
      )}
      {supported && !lost && (
        <Image
          className={`scene-poster ${ready ? "scene-poster-ready" : ""}`}
          unoptimized
          src={`/3d/${props.kind}-poster.webp`}
          alt=""
          width={900}
          height={720}
          priority
        />
      )}
      <SceneBoundary kind={props.kind} onFail={() => setLost(true)}>
        {!supported || lost ? (
          <Fallback kind={props.kind} />
        ) : (
          <Canvas
            dpr={coarse ? 1 : [1, 1.5]}
            frameloop={visible && props.motion ? "always" : "demand"}
            camera={sceneCamera}
            gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
            onCreated={({ gl }) => {
              gl.setClearColor(new Color("#000"), 0);
              gl.domElement.addEventListener(
                "webglcontextlost",
                () => setLost(true),
                { once: true },
              );
            }}
            fallback={<Fallback kind={props.kind} />}
          >
            <CameraPlacement kind={props.kind} />
            <ambientLight intensity={studio ? 0.8 : 1.3} />
            <directionalLight
              position={[3, 7, 5]}
              intensity={studio ? 2.7 : 2}
            />
            <directionalLight
              position={[-5, 3, -4]}
              color={studio ? "#c6d6ff" : "#c4e6e6"}
              intensity={2}
            />
            <Suspense fallback={null}>
              <Environment
                files="/3d/studio.hdr"
                environmentIntensity={studio ? 1.1 : 0.6}
              />
              <group visible={studio}>
                <ArcReactor {...props} active={studio} />
              </group>
              <group visible={!studio}>
                <Computer {...props} />
              </group>
              <ContentReady onReady={setReady} />
            </Suspense>
            <ContactShadows
              key={props.kind}
              position={[0, studio ? -2.1 : -1.33, 0]}
              opacity={studio ? 0.3 : 0.3}
              scale={10}
              blur={2.8}
              far={6}
              frames={1}
              resolution={256}
              color={studio ? "#58718e" : "#303351"}
            />
            {!coarse && (
              <OrbitControls
                makeDefault
                enableZoom={false}
                enablePan={false}
                minPolarAngle={0.7}
                maxPolarAngle={1.5}
                minAzimuthAngle={-0.8}
                maxAzimuthAngle={0.9}
              />
            )}
          </Canvas>
        )}
      </SceneBoundary>
      {supported && !lost && <Loader ready={ready} />}
    </div>
  );
}
