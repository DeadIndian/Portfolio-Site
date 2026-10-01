"use client";

import {
  Component,
  Suspense,
  useEffect,
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
  type Texture,
} from "three";

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

function StudioObject({
  exploded = true,
  rotation = 0,
  motion,
  onInteract,
}: SceneProps) {
  const root = useRef<Group>(null);
  const board = useRef<Group>(null);
  const cover = useRef<Group>(null);
  const [circuit, core] = useTexture(
    ["/3d/circuit.svg", "/3d/core.svg"],
    (textures) => {
      for (const texture of Array.isArray(textures) ? textures : [textures])
        texture.colorSpace = SRGBColorSpace;
    },
  );
  useFrame(({ pointer, clock }, delta) => {
    if (!root.current || !board.current || !cover.current) return;
    const t = Math.min(delta, 0.05);
    root.current.rotation.y = motion
      ? MathUtils.damp(
          root.current.rotation.y,
          -0.4 + rotation + pointer.x * 0.15,
          4,
          t,
        )
      : -0.4 + rotation;
    root.current.rotation.z = motion
      ? Math.sin(clock.elapsedTime * 0.38) * 0.025 - 0.055
      : -0.055;
    board.current.position.y = motion
      ? MathUtils.damp(board.current.position.y, exploded ? 0.7 : -0.45, 4, t)
      : exploded
        ? 0.7
        : -0.45;
    cover.current.position.y = motion
      ? MathUtils.damp(cover.current.position.y, exploded ? 2.2 : 0.15, 4, t)
      : exploded
        ? 2.2
        : 0.15;
  });
  return (
    <group ref={root} rotation={[0.08, -0.4, -0.055]} position={[0, -0.45, 0]}>
      <group position={[0, -0.85, 0]}>
        <RoundedBox
          args={[3.5, 0.42, 2.8]}
          radius={0.13}
          smoothness={4}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial
            color="#b9c1cc"
            metalness={0.85}
            roughness={0.27}
          />
        </RoundedBox>
        <RoundedBox
          args={[3.2, 0.09, 2.53]}
          radius={0.1}
          position={[0, 0.24, 0]}
        >
          <meshStandardMaterial
            color="#1b2738"
            metalness={0.65}
            roughness={0.35}
          />
        </RoundedBox>
        <Instances limit={26}>
          <boxGeometry args={[0.085, 0.105, 0.035]} />
          <meshStandardMaterial color="#243240" />
          {Array.from({ length: 26 }, (_, i) => (
            <Instance key={i} position={[-1.36 + i * 0.095, -0.005, 1.408]} />
          ))}
        </Instances>
        <mesh position={[1.5, 0, 1.409]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.045, 0.045, 0.015, 20]} />
          <meshStandardMaterial
            color="#7392ff"
            emissive="#365cf1"
            emissiveIntensity={1.6}
          />
        </mesh>
        {[-1.48, 1.48].flatMap((x) =>
          [-1.12, 1.12].map((z) => (
            <mesh key={`${x}:${z}`} position={[x, 0.3, z]}>
              <cylinderGeometry args={[0.055, 0.055, 0.15, 12]} />
              <meshStandardMaterial
                color="#5b6678"
                metalness={0.9}
                roughness={0.2}
              />
            </mesh>
          )),
        )}
      </group>
      <group
        ref={board}
        position={[0, 0.7, 0]}
        onClick={(event) => {
          event.stopPropagation();
          onInteract();
        }}
      >
        <RoundedBox args={[3.15, 0.16, 2.45]} radius={0.09}>
          <meshStandardMaterial
            color="#1e414d"
            metalness={0.5}
            roughness={0.5}
          />
        </RoundedBox>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.085, 0]}>
          <planeGeometry args={[3.06, 2.3]} />
          <meshBasicMaterial map={circuit} toneMapped={false} />
        </mesh>
        <RoundedBox
          args={[1.35, 0.29, 1.3]}
          radius={0.045}
          position={[0, 0.24, 0]}
          castShadow
        >
          <meshStandardMaterial
            color="#abb3c2"
            metalness={0.8}
            roughness={0.3}
          />
        </RoundedBox>
        <mesh position={[0, 0.39, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.29, 1.25]} />
          <meshBasicMaterial map={core} toneMapped={false} />
        </mesh>
        <Instances limit={48}>
          <boxGeometry args={[0.045, 0.055, 0.17]} />
          <meshStandardMaterial
            color="#d5b56f"
            metalness={0.7}
            roughness={0.3}
          />
          {Array.from({ length: 12 }, (_, i) =>
            [-1, 1].flatMap((side) => [
              <Instance
                key={`a${side}${i}`}
                position={[-0.55 + i * 0.1, 0.15, side * 0.73]}
              />,
              <Instance
                key={`b${side}${i}`}
                position={[side * 0.77, 0.15, -0.55 + i * 0.1]}
                rotation={[0, Math.PI / 2, 0]}
              />,
            ]),
          )}
        </Instances>
        {[-1.12, 1.12].map((x) => (
          <group key={x} position={[x, 0.17, -0.52]}>
            {[0, 0.4, 0.8].map((z) => (
              <RoundedBox
                key={z}
                args={[0.32, 0.14, 0.28]}
                radius={0.025}
                position={[0, 0, z]}
              >
                <meshStandardMaterial
                  color="#182a32"
                  metalness={0.4}
                  roughness={0.45}
                />
              </RoundedBox>
            ))}
          </group>
        ))}
      </group>
      <group ref={cover} position={[0, 2.2, 0]}>
        <RoundedBox args={[3.5, 0.16, 2.8]} radius={0.14} smoothness={4}>
          <meshPhysicalMaterial
            color="#b7d5f4"
            metalness={0.1}
            roughness={0.12}
            transparent
            opacity={0.43}
            clearcoat={1}
            side={2}
          />
        </RoundedBox>
        <RoundedBox
          args={[3.54, 0.08, 0.035]}
          position={[0, -0.025, 1.385]}
          radius={0.016}
        >
          <meshStandardMaterial
            color="#7994cd"
            metalness={0.8}
            roughness={0.3}
          />
        </RoundedBox>
        <RoundedBox
          args={[0.035, 0.08, 2.76]}
          position={[-1.745, -0.025, 0]}
          radius={0.016}
        >
          <meshStandardMaterial
            color="#b5c4e3"
            metalness={0.8}
            roughness={0.3}
          />
        </RoundedBox>
        {[-1.48, 1.48].flatMap((x) =>
          [-1.12, 1.12].map((z) => (
            <mesh key={`${x}:${z}`} position={[x, -0.09, z]}>
              <cylinderGeometry args={[0.06, 0.06, 0.08, 20]} />
              <meshStandardMaterial
                color="#8c9aaf"
                metalness={0.95}
                roughness={0.25}
              />
            </mesh>
          )),
        )}
      </group>
      {[-1.48, 1.48].flatMap((x) =>
        [-1.12, 1.12].map((z) => (
          <mesh key={`${x}:${z}`} position={[x, 0.5, z]}>
            <cylinderGeometry args={[0.007, 0.007, 3.7, 6]} />
            <meshBasicMaterial
              color="#8194b4"
              transparent
              opacity={exploded ? 0.33 : 0}
            />
          </mesh>
        )),
      )}
    </group>
  );
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

function Computer({ motion, rotation = 0, onInteract }: SceneProps) {
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
          ? "Exploded computer sculpture"
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
            <ambientLight intensity={studio ? 1.5 : 1.3} />
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
                environmentIntensity={studio ? 1.5 : 0.6}
              />
              <group visible={studio}>
                <StudioObject {...props} />
              </group>
              <group visible={!studio}>
                <Computer {...props} />
              </group>
              <ContentReady onReady={setReady} />
            </Suspense>
            <ContactShadows
              key={props.kind}
              position={[0, studio ? -1.8 : -1.33, 0]}
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
