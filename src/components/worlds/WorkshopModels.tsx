"use client";

import { useEffect, useRef, useState } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Instance, Instances, RoundedBox, useTexture } from "@react-three/drei";
import { CanvasTexture, CatmullRomCurve3, Group, MathUtils, Quaternion, RepeatWrapping, SRGBColorSpace, Vector3, type Texture } from "three";
import type { ChapterId, WorkshopAction } from "@/data/workshop";

type Point = [number, number, number];
const wood = "#b28a60";
const iron = "#25332f";
const paper = "#e2d6b8";

function Block({ size, at = [0, 0, 0], turn = [0, 0, 0], color = iron, metal = 0, map }: {
  size: Point; at?: Point; turn?: Point; color?: string; metal?: number; map?: Texture;
}) {
  return <RoundedBox args={size} radius={Math.min(.035, Math.min(...size) * .2)} smoothness={2} position={at} rotation={turn} castShadow receiveShadow>
    <meshStandardMaterial color={color} roughness={metal ? .38 : .78} metalness={metal} map={map} />
  </RoundedBox>;
}

function Rod({ from, to, radius = .025, color = iron, metal = .55 }: { from: Point; to: Point; radius?: number; color?: string; metal?: number }) {
  const a = new Vector3(...from), b = new Vector3(...to);
  const midpoint = a.clone().add(b).multiplyScalar(.5);
  const rotation = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), b.clone().sub(a).normalize());
  return <mesh position={midpoint} quaternion={rotation} castShadow><cylinderGeometry args={[radius, radius, a.distanceTo(b), 12]} /><meshStandardMaterial color={color} metalness={metal} roughness={.4} /></mesh>;
}

function Cable({ points, color = "#1c2421", radius = .017 }: { points: Point[]; color?: string; radius?: number }) {
  const [curve] = useState(() => new CatmullRomCurve3(points.map((p) => new Vector3(...p))));
  return <mesh castShadow><tubeGeometry args={[curve, 36, radius, 6, false]} /><meshStandardMaterial color={color} roughness={.65} /></mesh>;
}

function Caption({ text, at, size, turn = [0, 0, 0], background = "#e2d6b8", color = "#2d3e34" }: {
  text: string; at: Point; size: [number, number]; turn?: Point; background?: string; color?: string;
}) {
  const [texture] = useState(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512; canvas.height = 256;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = background; ctx.fillRect(0, 0, 512, 256);
    ctx.fillStyle = color; ctx.font = "500 32px monospace"; ctx.textAlign = "center";
    text.split("\n").forEach((line, i, lines) => ctx.fillText(line, 256, 140 + (i - (lines.length - 1) / 2) * 54));
    const map = new CanvasTexture(canvas); map.colorSpace = SRGBColorSpace;
    return map;
  });
  useEffect(() => () => texture.dispose(), [texture]);
  return <mesh position={at} rotation={turn}><planeGeometry args={size} /><meshStandardMaterial map={texture} roughness={.8} /></mesh>;
}

function makeWood() {
  const canvas = document.createElement("canvas"); canvas.width = 512; canvas.height = 256;
  const ctx = canvas.getContext("2d")!; ctx.fillStyle = "#bda185"; ctx.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 260; i++) {
    const value = Math.sin(i * 127.1) * 43758.5453;
    const grain = value - Math.floor(value);
    ctx.strokeStyle = `rgba(55,29,15,${.03 + grain * .15})`; ctx.lineWidth = .4 + grain;
    ctx.beginPath(); ctx.moveTo(0, i);
    ctx.bezierCurveTo(140, i + Math.sin(i * .5) * 7, 330, i - Math.sin(i * .18) * 5, 512, i);
    ctx.stroke();
  }
  const texture = new CanvasTexture(canvas); texture.colorSpace = SRGBColorSpace;
  texture.wrapS = texture.wrapT = RepeatWrapping; texture.repeat.set(2, 1);
  return texture;
}

function Room({ grain }: { grain: Texture }) {
  return <group>
    <Block size={[6.8, .24, 4.8]} at={[0, -.16, .1]} color="#20312a" />
    {Array.from({ length: 12 }, (_, i) => <Block key={i} size={[.548, .065, 4.6]} at={[-3.02 + i * .55, 0, .1]} color={i % 3 ? "#857052" : "#967755"} map={grain} />)}
    <Block size={[6.6, 3.45, .13]} at={[0, 1.71, -2.19]} color="#48574b" />
    <Block size={[.13, 3.45, 4.6]} at={[-3.28, 1.71, .05]} color="#53604f" />
    <Block size={[6.55, .13, .075]} at={[0, .14, -2.08]} color="#293c30" />
    <Block size={[.075, .13, 4.5]} at={[-3.18, .14, .05]} color="#293c30" />
    <Block size={[6.6, .1, .2]} at={[0, 3.46, -2.19]} color="#67705b" />
    <Block size={[.2, .1, 4.6]} at={[-3.28, 3.46, .05]} color="#67705b" />
    {/* A shallow window provides a cool counterpoint to the warm task light. */}
    <group position={[-3.185, 2.03, -.46]} rotation={[0, Math.PI / 2, 0]}>
      <Block size={[1.75, 1.9, .12]} color="#263f39" />
      <mesh position={[0, 0, .064]}><planeGeometry args={[1.55, 1.7]} /><meshBasicMaterial color="#587c80" /></mesh>
      <mesh position={[0, -.28, .07]}><planeGeometry args={[1.55, 1.14]} /><meshBasicMaterial color="#6c9290" /></mesh>
      {[-.83, .83].map((x) => <Block key={x} size={[.1, 1.96, .13]} at={[x, 0, .09]} color="#c2ba9e" />)}
      {[-.92, .92].map((y) => <Block key={y} size={[1.73, .1, .13]} at={[0, y, .09]} color="#c2ba9e" />)}
      <Block size={[.065, 1.8, .09]} at={[0, 0, .12]} color="#aaa88f" />
      <Block size={[1.64, .065, .09]} at={[0, .06, .12]} color="#aaa88f" />
      <Block size={[1.95, .12, .4]} at={[0, -1, .14]} color={wood} />
      {[0, 1, 2, 3].map((i) => <Block key={i} size={[1.76, .12, .045]} at={[0, .9 - i * .17, .19]} color="#777f66" />)}
      <Rod from={[.94, .83, .15]} to={[.94, -.6, .15]} radius={.008} color="#d0cbb2" />
    </group>
    <mesh position={[.15, .052, .85]} rotation={[-Math.PI / 2, 0, -.04]} receiveShadow>
      <planeGeometry args={[3.7, 2.15]} /><meshStandardMaterial color="#57604b" roughness={1} />
    </mesh>
    {[-1, 1].map((side) => <group key={side} position={[side * 1.82, .058, .85]}>
      {Array.from({ length: 23 }, (_, i) => <Rod key={i} from={[-.07, 0, -1 + i * .09]} to={[.07, 0, -1 + i * .09]} radius={.008} color="#afb298" metal={0} />)}
    </group>)}
  </group>;
}

function Desk({ grain }: { grain: Texture }) {
  return <group>
    <Block size={[5.3, .15, 1.45]} at={[-.1, 1.35, -1.04]} color="#b68a59" map={grain} />
    <Block size={[5.22, .045, .035]} at={[-.1, 1.3, -.302]} color="#775536" />
    {[-2.45, 2.25].map((x) => <group key={x}>
      <Block size={[.085, 1.27, .085]} at={[x, .665, -1.6]} metal={.55} />
      <Block size={[.085, 1.27, .085]} at={[x, .665, -.5]} metal={.55} />
      <Block size={[.1, .07, 1.3]} at={[x, .14, -1.05]} metal={.55} />
      <Block size={[.14, .07, 1.35]} at={[x, 1.24, -1.05]} metal={.55} />
    </group>)}
    <Rod from={[-2.45, .38, -1.62]} to={[2.25, 1.15, -1.62]} radius={.023} />
    <Block size={[2.05, .014, .85]} at={[-.52, 1.435, -.77]} color="#39443a" />
    <Block size={[.84, .12, .43]} at={[1.55, 1.47, -.77]} color="#526058" />
    <Block size={[.79, .045, .39]} at={[1.55, 1.55, -.77]} color={paper} />
    <Caption text={"IDEAS / STILL\nIN PROGRESS"} at={[1.55, 1.577, -.77]} size={[.67, .33]} turn={[-Math.PI / 2, 0, 0]} />
    <Rod from={[1.08, 1.46, -.46]} to={[1.55, 1.46, -.44]} radius={.013} color="#cf9c5f" />
  </group>;
}

function Monitor({ screen, onClick }: { screen: Texture; onClick: (event: ThreeEvent<MouseEvent>) => void }) {
  return <group position={[-.6, 1.44, -1.24]} onClick={onClick}>
    <Block size={[.64, .035, .38]} at={[0, .015, .03]} color="#34453e" metal={.6} />
    <Block size={[.105, .3, .09]} at={[0, .17, -.025]} metal={.6} />
    <group position={[0, .78, 0]} rotation={[-.08, 0, 0]}>
      <Block size={[1.92, 1.24, .105]} color="#172823" metal={.3} />
      <Block size={[1.83, 1.15, .016]} at={[0, .01, .06]} color="#0f1d1a" />
      <mesh position={[0, .025, .071]}><planeGeometry args={[1.74, 1.0875]} /><meshBasicMaterial map={screen} toneMapped={false} /></mesh>
      <mesh position={[.78, -.588, .064]}><sphereGeometry args={[.009, 10, 8]} /><meshBasicMaterial color="#a9d8b3" /></mesh>
      <Block size={[.065, .026, .034]} at={[0, .637, .015]} color="#121e18" />
      <mesh position={[0, .637, .035]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[.009, .009, .004, 10]} /><meshStandardMaterial color="#678e93" metalness={.8} roughness={.2} /></mesh>
    </group>
  </group>;
}

function Keyboard() {
  return <group position={[-.62, 1.48, -.52]} rotation={[.04, 0, 0]}>
    <Block size={[1.18, .065, .41]} color="#aaa98d" />
    <Instances limit={60} frames={1}>
      <boxGeometry args={[.067, .037, .064]} /><meshStandardMaterial color="#d1cbb3" roughness={.7} />
      {Array.from({ length: 60 }, (_, i) => <Instance key={i} position={[-.52 + i % 15 * .075, .05, -.145 + Math.floor(i / 15) * .075]} />)}
    </Instances>
    <Block size={[.38, .038, .051]} at={[0, .052, .155]} color="#bd9465" />
    <Block size={[.14, .055, .23]} at={[.84, .015, -.06]} color="#c3bca0" />
    <Rod from={[.84, .047, -.13]} to={[.84, .047, -.09]} radius={.009} color="#445148" />
  </group>;
}

function TaskLamp() {
  return <group position={[-2, 1.44, -1.12]}>
    <mesh><cylinderGeometry args={[.22, .25, .05, 32]} /><meshStandardMaterial color="#b99663" metalness={.65} roughness={.4} /></mesh>
    <Rod from={[0, .05, 0]} to={[-.18, .78, -.13]} radius={.035} color="#aca27d" />
    <Rod from={[-.18, .78, -.13]} to={[.35, 1.15, -.08]} radius={.025} color="#aca27d" />
    <Rod from={[-.12, .77, -.13]} to={[.36, 1.09, -.08]} radius={.012} color="#636954" />
    <mesh position={[-.18, .78, -.13]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[.065, .065, .1, 20]} /><meshStandardMaterial color="#b59d73" metalness={.6} /></mesh>
    <group position={[.39, 1.1, -.04]} rotation={[0, 0, -.36]}>
      <mesh castShadow><coneGeometry args={[.26, .25, 40, 1, true]} /><meshStandardMaterial color="#71816c" roughness={.48} metalness={.3} side={2} /></mesh>
      <mesh position={[0, -.11, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[.227, 40]} /><meshBasicMaterial color="#ffe1a7" /></mesh>
      <pointLight position={[0, -.24, 0]} intensity={2.4} color="#ffd09c" distance={3.6} decay={2} />
    </group>
    <Cable points={[[0, .04, -.15], [-.23, .28, -.16], [-.24, .76, -.16], [.32, 1.09, -.13]]} radius={.009} />
  </group>;
}

function Chair({ at = [0, 0, .45] as Point, turn = -.18 }: { at?: Point; turn?: number }) {
  return <group position={at} rotation={[0, turn, 0]}>
    <mesh position={[0, .34, 0]}><cylinderGeometry args={[.038, .055, .56, 18]} /><meshStandardMaterial color="#4f6355" metalness={.7} roughness={.35} /></mesh>
    {Array.from({ length: 5 }, (_, i) => {
      const a = i * Math.PI * 2 / 5;
      const x = Math.cos(a) * .38, z = Math.sin(a) * .38;
      return <group key={i}><Rod from={[0, .15, 0]} to={[x, .08, z]} radius={.022} /><mesh position={[x, .07, z]} rotation={[Math.PI / 2, a, 0]}><cylinderGeometry args={[.048, .048, .055, 14]} /><meshStandardMaterial color="#14231b" roughness={.8} /></mesh></group>;
    })}
    <Block size={[.69, .135, .65]} at={[0, .67, 0]} color="#607464" />
    <Block size={[.65, .63, .1]} at={[0, 1.035, .28]} turn={[-.14, 0, 0]} color="#516a5a" />
    <Block size={[.14, .44, .08]} at={[0, .76, .33]} metal={.6} />
    {[-1, 1].map((side) => <group key={side}><Rod from={[side * .29, .61, .11]} to={[side * .4, .86, .08]} radius={.024} /><Block size={[.07, .065, .42]} at={[side * .4, .89, 0]} color="#2d4337" /></group>)}
  </group>;
}

function Details({ photo, note, grain }: { photo: Texture; note: Texture; grain: Texture }) {
  return <group>
    <Block size={[1.55, .08, .42]} at={[-1.65, 2.91, -1.95]} color={wood} map={grain} />
    {[-2.23, -1.06].map((x) => <Rod key={x} from={[x, 2.66, -2.08]} to={[x, 2.89, -1.81]} radius={.023} />)}
    {["#a87651", "#526858", "#beae84", "#a79575", "#3d5e5c"].map((color, i) => <group key={color} position={[-2.25 + i * .13, 3.15, -1.95]} rotation={[0, 0, i === 4 ? -.15 : 0]}>
      <Block size={[.1, .38 + i % 2 * .07, .26]} color={color} />
      <Block size={[.076, .018, .005]} at={[0, -.12, .134]} color={paper} />
      <Block size={[.076, .013, .005]} at={[0, .12, .134]} color={paper} />
    </group>)}
    <group position={[-1.15, 3.12, -1.96]} rotation={[0, .04, 0]}>
      <Block size={[.37, .4, .04]} color="#b8a680" />
      <mesh position={[0, 0, .023]}><planeGeometry args={[.29, .32]} /><meshStandardMaterial map={photo} roughness={.75} /></mesh>
    </group>
    <Block size={[1.73, 1.24, .065]} at={[1.13, 2.53, -2.06]} color="#ad9875" />
    <Instances limit={88} frames={1}>
      <circleGeometry args={[.014, 8]} /><meshStandardMaterial color="#645f46" />
      {Array.from({ length: 88 }, (_, i) => <Instance key={i} position={[.4 + i % 11 * .147, 2.02 + Math.floor(i / 11) * .145, -2.021]} />)}
    </Instances>
    <mesh position={[1.53, 2.55, -2.013]} rotation={[0, 0, -.06]}><planeGeometry args={[.44, .55]} /><meshStandardMaterial map={note} roughness={1} /></mesh>
    <Caption text={"MAKE IT\nYOUR OWN."} at={[.88, 2.78, -2.011]} size={[.61, .29]} turn={[0, 0, .025]} />
    <Caption text={"dead@home\nKEEP BUILDING"} at={[.87, 2.37, -2.011]} size={[.57, .26]} turn={[0, 0, -.04]} background="#829982" color="#192e22" />
    {/* Mug: an open vessel with a visible rim and handle. */}
    <group position={[-1.72, 1.44, -.48]}>
      <mesh position={[0, .12, 0]} castShadow><cylinderGeometry args={[.1, .078, .24, 28, 1, true]} /><meshStandardMaterial color="#b47d51" roughness={.6} side={2} /></mesh>
      <mesh position={[0, .224, 0]} rotation={[-Math.PI / 2, 0, 0]}><torusGeometry args={[.095, .008, 8, 28]} /><meshStandardMaterial color="#d2ad77" /></mesh>
      <mesh position={[.104, .13, 0]}><torusGeometry args={[.058, .014, 8, 24]} /><meshStandardMaterial color="#b47d51" roughness={.6} /></mesh>
      <mesh position={[0, .19, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[.086, 24]} /><meshStandardMaterial color="#3a281e" roughness={.28} /></mesh>
    </group>
    <group position={[.65, 1.52, -.75]} rotation={[Math.PI / 2, 0, -.25]}>
      <mesh><torusGeometry args={[.2, .03, 10, 32, Math.PI]} /><meshStandardMaterial color="#20342c" roughness={.5} /></mesh>
      {[-.2, .2].map((x) => <Block key={x} size={[.11, .18, .15]} at={[x, -.035, 0]} color="#bdab85" />)}
    </group>
    <Cable points={[[-.6, 1.5, -1.5], [-.6, 1.2, -1.9], [-.4, .7, -1.94], [.15, .2, -1.9], [.9, .15, -1.8]]} />
    <Caption text={"DEADINDIAN\nA WORK IN PROGRESS"} at={[0, -.105, 2.515]} size={[1.38, .145]} background="#273a2e" color="#c2b58f" />
  </group>;
}

export interface WorkshopModelProps {
  chapter: ChapterId;
  era: number;
  rotation: number;
  motion: boolean;
  chairPulled: boolean;
  exploded: boolean;
  onAction: (action: WorkshopAction) => void;
}

export function WorkshopModels({ chapter, era, rotation, motion, onAction }: WorkshopModelProps) {
  const root = useRef<Group>(null);
  const [grain] = useState(makeWood);
  useEffect(() => () => grain.dispose(), [grain]);
  const [kubuntu, arch, fedora, photo, note, calculator] = useTexture([
    "/3d/workshop-kubuntu.svg", "/3d/workshop-arch.svg", "/3d/workshop-fedora.svg",
    "/images/bharath.webp", "/3d/workshop-note.svg", "/images/calculator.webp",
  ], (textures) => {
    for (const texture of Array.isArray(textures) ? textures : [textures]) { texture.colorSpace = SRGBColorSpace; texture.anisotropy = 4; }
  });
  useFrame((_, delta) => {
    if (root.current) root.current.rotation.y = motion ? MathUtils.damp(root.current.rotation.y, rotation, 6, Math.min(delta, .05)) : rotation;
  });
  const screen = chapter === "learning" ? calculator : [kubuntu, arch, fedora][era];
  return <group ref={root}>
    <Room grain={grain} />
    <Desk grain={grain} />
    <Monitor screen={screen} onClick={(event) => { event.stopPropagation(); if (event.delta < 5) onAction(chapter === "learning" ? "handmade" : "screen"); }} />
    <Keyboard />
    <TaskLamp />
    <Chair />
    <Details photo={photo} note={note} grain={grain} />
  </group>;
}
