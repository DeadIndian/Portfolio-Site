"use client";

import {
  Component,
  Suspense,
  useEffect,
  useCallback,
  useLayoutEffect,
  useMemo,
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
import {
  CanvasTexture,
  Color,
  DoubleSide,
  Group,
  MathUtils,
  ShaderMaterial,
  SRGBColorSpace,
  Vector3,
  type Texture,
} from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { WorkshopModels, type WorkshopModelProps } from "./WorkshopModels";

type SceneProps = {
  kind: "workshop" | "desktop";
  workshop: Omit<WorkshopModelProps, "motion" | "rotation">;
  resetKey: number;
  rotation?: number;
  motion: boolean;
  onInteract: () => void;
};
const sceneCamera = {
  position: [6.4, 4.9, 8.6] as [number, number, number],
  fov: 34,
};

function CameraPlacement({ kind, chapter, motion, resetKey }: { kind: SceneProps["kind"]; chapter: string; motion: boolean; resetKey: number }) {
  const camera = useThree((state) => state.camera);
  const invalidate = useThree((state) => state.invalidate);
  const controls = useThree((state) => state.controls) as OrbitControlsImpl | null;
  const size = useThree((state) => state.size);
  const goal = useRef({ position: new Vector3(), target: new Vector3(), moving: false });
  useLayoutEffect(() => {
    const target = goal.current;
    if (kind === "workshop") {
      target.target.set(0, 1.35, -.1);
      target.position.set(chapter === "linux" ? 7.8 : 8.2, chapter === "linux" ? 6.1 : 7, 10.1);
      if (size.width / size.height < 1.05) target.position.sub(target.target).multiplyScalar(1.15).add(target.target);
    } else { target.position.set(4.3, 2.2, 7.6); target.target.set(0, 0, 0); }
    target.moving = motion && kind === "workshop";
    if (!target.moving) {
      camera.position.copy(target.position); camera.lookAt(target.target);
      controls?.target.copy(target.target); controls?.update();
    }
    invalidate();
  }, [kind, chapter, camera, controls, invalidate, motion, resetKey, size.width, size.height]);
  useEffect(() => {
    const stop = () => { goal.current.moving = false; };
    controls?.addEventListener("start", stop);
    return () => controls?.removeEventListener("start", stop);
  }, [controls]);
  useFrame((_, delta) => {
    if (!goal.current.moving) return;
    const alpha = 1 - Math.exp(-5 * Math.min(delta, .05));
    camera.position.lerp(goal.current.position, alpha);
    if (controls) { controls.target.lerp(goal.current.target, alpha); controls.update(); }
    else camera.lookAt(goal.current.target);
    if (camera.position.distanceTo(goal.current.position) < .002) goal.current.moving = false;
  }, -2);
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

/**
 * Fedora marks are trademarks of Red Hat, Inc. and the official vectors are not
 * published: they must be requested from logo@fedoraproject.org. This draws the
 * brand-coloured badge procedurally so the scene needs no external asset. To use
 * the official artwork, drop it at public/brands/fedora.svg and replace this
 * canvas paint with that file.
 */
function fedoraBadgeTexture() {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.clearRect(0, 0, size, size);
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 4, 0, Math.PI * 2);
    ctx.fillStyle = "#294172";
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = "#3c6eb4";
    ctx.stroke();
    ctx.fillStyle = "#e8eef7";
    ctx.font = "800 168px Manrope, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("f", size / 2, size * 0.74);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

function FedoraBadge() {
  const texture = useMemo(() => fedoraBadgeTexture(), []);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <group
      position={[2.05, -0.5, 1.05]}
      rotation={[0, -0.34, 0.04]}
      scale={0.62}
    >
      <mesh position={[0, 0, -0.02]}>
        <circleGeometry args={[1.06, 56]} />
        <meshStandardMaterial color="#16233d" roughness={0.4} metalness={0.5} />
      </mesh>
      <mesh>
        <circleGeometry args={[1, 56]} />
        <meshStandardMaterial
          map={texture}
          transparent
          roughness={0.28}
          metalness={0.1}
          side={DoubleSide}
        />
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
      <FedoraBadge />
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
  const [readyKind, setReadyKind] = useState<string | null>(null);
  const ready = readyKind === props.kind;
  const onReady = useCallback(() => setReadyKind(props.kind), [props.kind]);
  const [documentVisible, setDocumentVisible] = useState(() => !document.hidden);
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
  useEffect(() => {
    const update = () => setDocumentVisible(!document.hidden);
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);
  const workshop = props.kind === "workshop";
  return (
    <div
      className={`world-scene ${props.kind}-scene`}
      ref={wrapper}
      data-scene-ready={ready}
      data-webgl={supported && !lost ? "available" : "unavailable"}
      data-chapter={workshop ? props.workshop.chapter : undefined}
      role="img"
      aria-label={
        workshop
          ? "Miniature of DeadIndian's evolving workshop"
          : "Retro computer and Fedora desktop sculpture"
      }
    >
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
            frameloop={visible && documentVisible && props.motion ? "always" : "demand"}
            shadows="percentage"
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
            <CameraPlacement kind={props.kind} chapter={props.workshop.chapter} motion={props.motion} resetKey={props.resetKey} />
            <ambientLight intensity={workshop ? 0.7 : 1.3} />
            <directionalLight
              position={workshop ? [-3, 7, 5] : [3, 7, 5]}
              color={workshop ? "#ffe1b4" : "#ffffff"}
              intensity={workshop ? 3.1 : 2}
              castShadow={workshop}
              shadow-mapSize={coarse ? [512, 512] : [1024, 1024]}
              shadow-camera-left={-5} shadow-camera-right={5}
              shadow-camera-top={5} shadow-camera-bottom={-5}
              shadow-normalBias={.035}
            />
            <directionalLight
              position={[-5, 3, -4]}
              color={workshop ? "#bedde4" : "#c4e6e6"}
              intensity={workshop ? 1.2 : 2}
            />
            <Suspense fallback={null}>
              <Environment
                files="/3d/studio.hdr"
                environmentIntensity={workshop ? .35 : .6}
              />
              {workshop ? <WorkshopModels {...props.workshop} motion={props.motion} rotation={props.rotation ?? 0} /> : <Computer {...props} />}
              <ContentReady onReady={onReady} />
            </Suspense>
            {!workshop && <ContactShadows
              key={props.kind}
              position={[0, -1.33, 0]}
              opacity={.3}
              scale={10}
              blur={2.8}
              far={6}
              frames={1}
              resolution={256}
              color="#303351"
            />}
            {!coarse && (
              <OrbitControls
                makeDefault
                enableZoom={false}
                enablePan={false}
                minPolarAngle={workshop ? .6 : .7}
                maxPolarAngle={workshop ? 1.3 : 1.5}
                minAzimuthAngle={workshop ? -.3 : -.8}
                maxAzimuthAngle={workshop ? 1.2 : .9}
              />
            )}
          </Canvas>
        )}
      </SceneBoundary>
      {supported && !lost && <Loader ready={ready} />}
    </div>
  );
}
