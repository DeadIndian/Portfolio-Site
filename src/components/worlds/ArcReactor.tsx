"use client";

import { useEffect, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html, Instance, Instances, useTexture } from "@react-three/drei";
import {
  CatmullRomCurve3,
  Group,
  MathUtils,
  Path,
  Shape,
  SRGBColorSpace,
  Vector3,
  type ExtrudeGeometryOptions,
  type MeshBasicMaterial,
} from "three";

const TAU = Math.PI * 2;
const steel = "#a6b4c0";
const graphite = "#253440";
const copper = "#bd7149";
const assembled = [-0.43, -0.08, 0.025, 0.22, 0.23];
const separated = [-1.7, -0.75, 0.22, 1.04, 1.8];

function ReactorRing({
  outer,
  inner,
  height = 0.08,
  y = 0,
  color = steel,
}: {
  outer: number;
  inner: number;
  height?: number;
  y?: number;
  color?: string;
}) {
  const [args] = useState<[Shape, ExtrudeGeometryOptions]>(() => {
    const shape = new Shape();
    shape.absarc(0, 0, outer, 0, TAU, false);
    const hole = new Path();
    hole.absarc(0, 0, inner, 0, TAU, true);
    shape.holes.push(hole);
    return [
      shape,
      {
        depth: height,
        bevelEnabled: true,
        bevelSegments: 1,
        steps: 1,
        bevelSize: 0.009,
        bevelThickness: 0.009,
        curveSegments: 48,
      },
    ];
  });

  return (
    <mesh position={[0, y - height / 2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <extrudeGeometry args={args} />
      <meshStandardMaterial color={color} metalness={0.86} roughness={0.29} />
    </mesh>
  );
}

function Fasteners({
  radius,
  count,
  y,
  offset = 0,
}: {
  radius: number;
  count: number;
  y: number;
  offset?: number;
}) {
  return (
    <group>
      <Instances limit={count} frames={1}>
        <cylinderGeometry args={[0.071, 0.071, 0.018, 16]} />
        <meshStandardMaterial
          color={graphite}
          metalness={0.7}
          roughness={0.32}
        />
        {Array.from({ length: count }, (_, i) => {
          const a = (i / count) * TAU + offset;
          return (
            <Instance
              key={i}
              position={[Math.cos(a) * radius, y, Math.sin(a) * radius]}
            />
          );
        })}
      </Instances>
      <Instances limit={count} frames={1}>
        <cylinderGeometry args={[0.048, 0.048, 0.035, 6]} />
        <meshStandardMaterial
          color="#cfdae0"
          metalness={0.92}
          roughness={0.22}
        />
        {Array.from({ length: count }, (_, i) => {
          const a = (i / count) * TAU + offset;
          return (
            <Instance
              key={i}
              position={[Math.cos(a) * radius, y + 0.023, Math.sin(a) * radius]}
              rotation={[0, a, 0]}
            />
          );
        })}
      </Instances>
      <Instances limit={count} frames={1}>
        <cylinderGeometry args={[0.019, 0.019, 0.003, 6]} />
        <meshStandardMaterial color="#17212a" roughness={0.65} />
        {Array.from({ length: count }, (_, i) => {
          const a = (i / count) * TAU + offset;
          return (
            <Instance
              key={i}
              position={[Math.cos(a) * radius, y + 0.042, Math.sin(a) * radius]}
              rotation={[0, a, 0]}
            />
          );
        })}
      </Instances>
    </group>
  );
}

function LayerLabel({
  number,
  children,
}: {
  number: string;
  children: string;
}) {
  return (
    <Html
      position={[2.2, 0, -1.12]}
      wrapperClass="reactor-layer-anchor"
      style={{ pointerEvents: "none" }}
    >
      <span className="reactor-layer-label" aria-hidden="true">
        <span>{number}</span>
        {children}
      </span>
    </Html>
  );
}

export function ArcReactor({
  exploded = false,
  rotation = 0,
  motion,
  active,
  onInteract,
}: {
  exploded?: boolean;
  rotation?: number;
  motion: boolean;
  active: boolean;
  onInteract: () => void;
}) {
  const root = useRef<Group>(null);
  const layers = useRef<(Group | null)[]>([]);
  const light = useRef<MeshBasicMaterial>(null);
  const phase = useRef(0);
  const canvas = useThree((state) => state.gl.domElement);
  const gesture = useRef<{
    id: number;
    x: number;
    y: number;
    dragged: boolean;
  } | null>(null);
  const [markings, halo] = useTexture(
    ["/3d/reactor-markings.svg", "/3d/reactor-glow.svg"],
    (textures) => {
      for (const texture of Array.isArray(textures) ? textures : [textures])
        texture.colorSpace = SRGBColorSpace;
    },
  );
  const [winding] = useState(() => {
    // A toroidal helix gives every induction coil ten actual copper windings.
    const points = Array.from({ length: 241 }, (_, i) => {
      const t = i / 240;
      const a = (t - 0.5) * 0.35;
      const turn = t * TAU * 10;
      const radius = 1.435 + Math.cos(turn) * 0.205;
      return new Vector3(
        Math.cos(a) * radius,
        Math.sin(turn) * 0.205,
        Math.sin(a) * radius,
      );
    });
    return new CatmullRomCurve3(points);
  });
  const [wire] = useState(
    () =>
      new CatmullRomCurve3([
        new Vector3(1.64, -0.09, -0.3),
        new Vector3(1.78, -0.15, -0.38),
        new Vector3(1.83, -0.19, 0),
        new Vector3(1.77, -0.13, 0.38),
        new Vector3(1.64, -0.07, 0.3),
      ]),
  );
  const [cells] = useState(() => {
    const positions: [number, number, number][] = [];
    for (let col = -7; col <= 7; col++) {
      for (let row = -7; row <= 7; row++) {
        const x = col * 0.087;
        const z = row * 0.1 + (col % 2) * 0.05;
        const radius = Math.hypot(x, z);
        if (radius < 0.6 && radius > 0.26) positions.push([x, 0.086, z]);
      }
    }
    return positions;
  });

  useEffect(() => {
    if (!active) return;
    gesture.current = null;
    const start = (event: PointerEvent) => {
      gesture.current = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        dragged: false,
      };
    };
    const move = (event: PointerEvent) => {
      const current = gesture.current;
      if (
        current?.id === event.pointerId &&
        Math.hypot(event.clientX - current.x, event.clientY - current.y) >= 5
      )
        current.dragged = true;
    };
    const cancel = () => {
      if (gesture.current) gesture.current.dragged = true;
    };
    // Track the whole gesture, including an orbit that returns to its starting point.
    canvas.addEventListener("pointerdown", start);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointercancel", cancel);
    return () => {
      canvas.removeEventListener("pointerdown", start);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointercancel", cancel);
    };
  }, [active, canvas]);

  useFrame(({ pointer }, delta) => {
    if (!active || !root.current) return;
    const t = Math.min(delta, 0.05);
    const approach = (current: number, target: number) =>
      motion ? MathUtils.damp(current, target, 5, t) : target;
    root.current.rotation.x = approach(
      root.current.rotation.x,
      exploded ? 0.12 : 0.58,
    );
    root.current.rotation.y = approach(
      root.current.rotation.y,
      -0.42 + rotation + (motion ? pointer.x * 0.08 : 0),
    );
    root.current.rotation.z = approach(
      root.current.rotation.z,
      exploded ? -0.16 : -0.2,
    );
    root.current.scale.setScalar(
      approach(root.current.scale.x, exploded ? 0.92 : 1.22),
    );
    layers.current.forEach((layer, i) => {
      if (layer)
        layer.position.y = approach(
          layer.position.y,
          exploded ? separated[i] : assembled[i],
        );
    });
    if (motion) phase.current += t;
    if (light.current)
      light.current.opacity = 0.62 + Math.sin(phase.current * 1.3) * 0.035;
  });

  return (
    <group
      ref={root}
      position={[0, 0.68, 0]}
      rotation={[0.58, -0.42, -0.2]}
      scale={1.22}
      onClick={(event) => {
        if (!active) return;
        event.stopPropagation();
        if (!gesture.current?.dragged && event.delta < 5) onInteract();
      }}
    >
      {/* 01: vented containment housing, heat sink and exposed bus rings. */}
      <group
        ref={(node) => {
          layers.current[0] = node;
        }}
        position={[0, assembled[0], 0]}
      >
        <mesh position={[0, -0.235, 0]}>
          <cylinderGeometry args={[1.87, 1.8, 0.12, 96]} />
          <meshStandardMaterial
            color={graphite}
            metalness={0.88}
            roughness={0.32}
          />
        </mesh>
        <ReactorRing outer={1.93} inner={1.64} height={0.38} color={graphite} />
        <ReactorRing outer={1.96} inner={1.79} height={0.055} y={-0.18} />
        <ReactorRing outer={1.965} inner={1.69} height={0.06} y={0.19} />
        <ReactorRing
          outer={1.94}
          inner={1.9}
          height={0.025}
          y={0.11}
          color={copper}
        />
        <ReactorRing
          outer={1.34}
          inner={1.28}
          height={0.025}
          y={-0.14}
          color={copper}
        />
        <ReactorRing
          outer={1.14}
          inner={1.09}
          height={0.025}
          y={-0.14}
          color={copper}
        />
        <Instances limit={48} frames={1}>
          <boxGeometry args={[0.024, 0.19, 0.092]} />
          <meshStandardMaterial color="#0e1920" roughness={0.7} />
          {Array.from({ length: 48 }, (_, i) => {
            const a = (i / 48) * TAU;
            return (
              <Instance
                key={i}
                position={[Math.cos(a) * 1.936, -0.025, Math.sin(a) * 1.936]}
                rotation={[0, -a, 0]}
              />
            );
          })}
        </Instances>
        <Instances limit={40} frames={1}>
          <boxGeometry args={[0.83, 0.065, 0.026]} />
          <meshStandardMaterial
            color="#667c89"
            metalness={0.88}
            roughness={0.34}
          />
          {Array.from({ length: 40 }, (_, i) => {
            const a = (i / 40) * TAU;
            return (
              <Instance
                key={i}
                position={[Math.cos(a) * 0.98, -0.12, Math.sin(a) * 0.98]}
                rotation={[0, -a, 0]}
              />
            );
          })}
        </Instances>
        <mesh position={[0, -0.11, 0]}>
          <cylinderGeometry args={[0.48, 0.48, 0.13, 48]} />
          <meshStandardMaterial
            color={copper}
            metalness={0.9}
            roughness={0.29}
          />
        </mesh>
        <ReactorRing
          outer={0.4}
          inner={0.29}
          height={0.04}
          y={-0.025}
          color={graphite}
        />
        <Fasteners radius={1.79} count={10} y={0.224} offset={Math.PI / 10} />
        {active && exploded && (
          <LayerLabel number="01">Containment housing</LayerLabel>
        )}
      </group>

      {/* 02: luminous induction ring, toroidal windings and insulated returns. */}
      <group
        ref={(node) => {
          layers.current[1] = node;
        }}
        position={[0, assembled[1], 0]}
      >
        <ReactorRing
          outer={1.72}
          inner={1.16}
          height={0.07}
          y={-0.14}
          color={graphite}
        />
        <ReactorRing
          outer={1.77}
          inner={1.71}
          height={0.05}
          y={-0.09}
          color={copper}
        />
        <ReactorRing outer={1.17} inner={1.12} height={0.12} y={-0.05} />
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.435, 0.166, 12, 96]} />
          <meshBasicMaterial color="#82efff" toneMapped={false} />
        </mesh>
        <mesh position={[0, 0.151, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.435, 0.033, 6, 96]} />
          <meshBasicMaterial color="#e5ffff" toneMapped={false} />
        </mesh>
        <pointLight
          position={[0, 0.3, 0]}
          color="#67def5"
          intensity={2.5}
          distance={4}
        />
        <Instances limit={10} frames={1}>
          <tubeGeometry args={[winding, 200, 0.022, 6, false]} />
          <meshStandardMaterial
            color={copper}
            metalness={0.9}
            roughness={0.25}
          />
          {Array.from({ length: 10 }, (_, i) => (
            <Instance key={i} rotation={[0, (i / 10) * TAU, 0]} />
          ))}
        </Instances>
        <Instances limit={20} frames={1}>
          <boxGeometry args={[0.46, 0.055, 0.055]} />
          <meshStandardMaterial
            color="#94a5b0"
            metalness={0.86}
            roughness={0.3}
          />
          {Array.from({ length: 20 }, (_, i) => {
            const a = (Math.floor(i / 2) * TAU) / 10 + (i % 2 ? 0.205 : -0.205);
            return (
              <Instance
                key={i}
                position={[Math.cos(a) * 1.435, -0.11, Math.sin(a) * 1.435]}
                rotation={[0, -a, 0]}
              />
            );
          })}
        </Instances>
        {["#314f63", "#79422e", "#314f63", "#79422e", "#314f63"].map(
          (color, i) => (
            <mesh key={i} rotation={[0, (i / 5) * TAU, 0]}>
              <tubeGeometry args={[wire, 32, 0.025, 6, false]} />
              <meshStandardMaterial
                color={color}
                roughness={0.52}
                metalness={0.15}
              />
            </mesh>
          ),
        )}
        <Fasteners radius={1.735} count={10} y={-0.032} offset={Math.PI / 10} />
        <mesh
          position={[0, -0.18, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          raycast={() => null}
        >
          <planeGeometry args={[4.7, 4.7]} />
          <meshBasicMaterial
            ref={light}
            map={halo}
            transparent
            opacity={0.62}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
        {active && exploded && (
          <LayerLabel number="02">Copper induction coils</LayerLabel>
        )}
      </group>

      {/* 03: perforated palladium cartridge and three-point retention cage. */}
      <group
        ref={(node) => {
          layers.current[2] = node;
        }}
        position={[0, assembled[2], 0]}
      >
        <ReactorRing
          outer={1.065}
          inner={0.73}
          height={0.15}
          y={-0.055}
          color={graphite}
        />
        <ReactorRing outer={1.08} inner={1.015} height={0.04} y={0.035} />
        <ReactorRing outer={0.98} inner={0.76} height={0.035} y={0.039} />
        <ReactorRing
          outer={0.745}
          inner={0.685}
          height={0.08}
          y={0.055}
          color={copper}
        />
        <mesh position={[0, 0.02, 0]}>
          <cylinderGeometry args={[0.682, 0.682, 0.115, 64]} />
          <meshBasicMaterial color="#b3f5ff" toneMapped={false} />
        </mesh>
        <Instances limit={cells.length} frames={1}>
          <torusGeometry args={[0.054, 0.008, 4, 6]} />
          <meshStandardMaterial
            color="#3d646f"
            metalness={0.65}
            roughness={0.38}
          />
          {cells.map((position, i) => (
            <Instance
              key={i}
              position={position}
              rotation={[-Math.PI / 2, 0, 0]}
            />
          ))}
        </Instances>
        <ReactorRing outer={0.265} inner={0.215} height={0.045} y={0.1} />
        <mesh position={[0, 0.09, 0]}>
          <cylinderGeometry args={[0.21, 0.21, 0.04, 40]} />
          <meshBasicMaterial color="#efffff" toneMapped={false} />
        </mesh>
        <Instances limit={36} frames={1}>
          <boxGeometry args={[0.032, 0.07, 0.07]} />
          <meshStandardMaterial color="#0c202a" roughness={0.6} />
          {Array.from({ length: 36 }, (_, i) => {
            const a = (i / 36) * TAU;
            return (
              <Instance
                key={i}
                position={[Math.cos(a) * 1.066, -0.043, Math.sin(a) * 1.066]}
                rotation={[0, -a, 0]}
              />
            );
          })}
        </Instances>
        {[0, 1, 2].map((i) => (
          <group key={i} rotation={[0, (i / 3) * TAU + Math.PI / 6, 0]}>
            <mesh position={[0.72, 0.135, 0]}>
              <boxGeometry args={[0.61, 0.065, 0.11]} />
              <meshStandardMaterial
                color={steel}
                metalness={0.92}
                roughness={0.24}
              />
            </mesh>
            <mesh position={[0.75, 0.169, 0]}>
              <boxGeometry args={[0.29, 0.005, 0.037]} />
              <meshStandardMaterial
                color={graphite}
                metalness={0.6}
                roughness={0.4}
              />
            </mesh>
          </group>
        ))}
        <Fasteners radius={0.96} count={6} y={0.06} offset={Math.PI / 6} />
        {active && exploded && (
          <LayerLabel number="03">Palladium core</LayerLabel>
        )}
      </group>

      {/* 04: optical shield; transparent so the cartridge is visible when closed. */}
      <group
        ref={(node) => {
          layers.current[3] = node;
        }}
        position={[0, assembled[3], 0]}
      >
        <mesh>
          <cylinderGeometry args={[1.095, 1.095, 0.032, 96]} />
          <meshPhysicalMaterial
            color="#bfeeff"
            metalness={0.12}
            roughness={0.08}
            transparent
            opacity={0.16}
            clearcoat={1}
            depthWrite={false}
          />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.094, 0.018, 6, 96]} />
          <meshStandardMaterial
            color="#a0dee9"
            metalness={0.75}
            roughness={0.2}
          />
        </mesh>
        <mesh position={[0, 0.018, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.875, 0.004, 4, 96]} />
          <meshBasicMaterial color="#d5f5ff" transparent opacity={0.6} />
        </mesh>
        <Instances limit={24} frames={1}>
          <boxGeometry args={[0.045, 0.003, 0.008]} />
          <meshBasicMaterial color="#d5f5ff" transparent opacity={0.75} />
          {Array.from({ length: 24 }, (_, i) => {
            const a = (i / 24) * TAU;
            return (
              <Instance
                key={i}
                position={[Math.cos(a) * 0.96, 0.019, Math.sin(a) * 0.96]}
                rotation={[0, -a, 0]}
              />
            );
          })}
        </Instances>
        {[0, 1, 2].map((i) => (
          <group key={i} rotation={[0, (i / 3) * TAU + Math.PI / 6, 0]}>
            <mesh position={[1.08, -0.008, 0]}>
              <boxGeometry args={[0.13, 0.035, 0.13]} />
              <meshStandardMaterial
                color={steel}
                metalness={0.8}
                roughness={0.3}
              />
            </mesh>
          </group>
        ))}
        {active && exploded && (
          <LayerLabel number="04">Optical shield</LayerLabel>
        )}
      </group>

      {/* 05: engraved locking bezel, radial braces and recessed hex fasteners. */}
      <group
        ref={(node) => {
          layers.current[4] = node;
        }}
        position={[0, assembled[4], 0]}
      >
        <ReactorRing outer={1.98} inner={1.76} height={0.13} />
        <ReactorRing outer={1.985} inner={1.946} height={0.025} y={0.08} />
        <ReactorRing
          outer={1.785}
          inner={1.754}
          height={0.025}
          y={0.079}
          color={graphite}
        />
        <ReactorRing outer={1.19} inner={1.08} height={0.085} y={0.025} />
        <ReactorRing
          outer={1.105}
          inner={1.08}
          height={0.025}
          y={0.077}
          color={graphite}
        />
        <Instances limit={60} frames={1}>
          <boxGeometry args={[0.058, 0.004, 0.012]} />
          <meshStandardMaterial color="#364b5b" roughness={0.6} />
          {Array.from({ length: 60 }, (_, i) => {
            const a = (i / 60) * TAU;
            return (
              <Instance
                key={i}
                position={[Math.cos(a) * 1.925, 0.076, Math.sin(a) * 1.925]}
                rotation={[0, -a, 0]}
                scale={[i % 5 === 0 ? 1 : 0.5, 1, 1]}
              />
            );
          })}
        </Instances>
        {[0, 1, 2].map((i) => (
          <group key={i} rotation={[0, (i / 3) * TAU + Math.PI / 6, 0]}>
            <mesh position={[1.48, 0.008, 0]}>
              <boxGeometry args={[0.7, 0.11, 0.145]} />
              <meshStandardMaterial
                color={steel}
                metalness={0.9}
                roughness={0.26}
              />
            </mesh>
            <mesh position={[1.48, 0.065, 0]}>
              <boxGeometry args={[0.4, 0.008, 0.058]} />
              <meshStandardMaterial
                color={graphite}
                metalness={0.7}
                roughness={0.4}
              />
            </mesh>
          </group>
        ))}
        <Fasteners radius={1.855} count={10} y={0.08} offset={Math.PI / 10} />
        <Fasteners radius={1.137} count={3} y={0.079} offset={-Math.PI / 6} />
        <mesh
          position={[0, 0.08, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          raycast={() => null}
        >
          <planeGeometry args={[4.15, 4.15]} />
          <meshBasicMaterial
            map={markings}
            transparent
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
        {active && exploded && (
          <LayerLabel number="05">Locking bezel</LayerLabel>
        )}
      </group>
    </group>
  );
}
