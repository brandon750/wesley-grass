import React, { Suspense, useEffect, useMemo, useRef } from "react"
import { Canvas, useThree, useLoader, useFrame } from "@react-three/fiber"
import { Sky as DreiSky, Environment } from "@react-three/drei"
import { EffectComposer, DepthOfField } from "@react-three/postprocessing"
import * as THREE from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"
import Grass from "./Grass"
import wyvernUrl from "./resources/wyvern-w-material.glb"
import swanUrl from "./resources/swan-w-material.glb"
import shellsUrl from "./resources/shells-w-material.glb"

const sun = new THREE.Vector3()
const effectController = {
  turbidity: 2,
  rayleigh: 0.1,
  mieCoefficient: 0.005,
  mieDirectionalG: 0.7,
  elevation: 45,
  azimuth: 180,
}

const phi = THREE.MathUtils.degToRad(90 - effectController.elevation)
const theta = THREE.MathUtils.degToRad(effectController.azimuth)
sun.setFromSphericalCoords(1, phi, theta)

const WYVERN_POSITION = [-12, 21, 0]
const WYVERN_ROTATION = [0.015, -0.05, -0.1]
const WYVERN_SCALE = [26, 26, 26]

const SWAN_POSITION = [0, 7, -40]
const SWAN_ROTATION = [-0.02, -0.75, -0.1]
const SWAN_SCALE = [20, 20, 20]

const SHELLS_POSITION = [-2, -0.6, 33]
const SHELLS_ROTATION = [0.1, 0.6, -0.12]
const SHELLS_SCALE = [14, 14, 14]

const DOF_TARGET = new THREE.Vector3()
  .fromArray(WYVERN_POSITION)
  .add(new THREE.Vector3().fromArray(SWAN_POSITION))
  .add(new THREE.Vector3().fromArray(SHELLS_POSITION))
  .multiplyScalar(1 / 3)

function CustomSky() {
  return (
    <DreiSky
      distance={450000}
      turbidity={effectController.turbidity}
      rayleigh={effectController.rayleigh}
      mieCoefficient={effectController.mieCoefficient}
      mieDirectionalG={effectController.mieDirectionalG}
      sunPosition={sun.toArray()}
    />
  )
}

function applyModelDefaults(root) {
  root.traverse((child) => {
    if (!child.isMesh) return
    child.castShadow = true
    child.receiveShadow = true

    const materials = Array.isArray(child.material) ? child.material : [child.material]
    materials.forEach((mat) => {
      if (!mat) return
      if (mat.envMapIntensity !== undefined) mat.envMapIntensity = 1
      mat.needsUpdate = true
    })
  })
}

function Wyvern() {
  const gltf = useLoader(GLTFLoader, wyvernUrl)

  useEffect(() => {
    applyModelDefaults(gltf.scene)
  }, [gltf])

  // -- WYVERN CONTROLS --
  const wyvernPosition = WYVERN_POSITION // [x, y, z]
  const wyvernRotation = WYVERN_ROTATION // [x, y, z] in radians
  const wyvernScale = WYVERN_SCALE // [x, y, z]

  return <primitive object={gltf.scene} position={wyvernPosition} rotation={wyvernRotation} scale={wyvernScale} />
}

function Swan() {
  const gltf = useLoader(GLTFLoader, swanUrl)

  useEffect(() => {
    applyModelDefaults(gltf.scene)
  }, [gltf])

  // -- SWAN CONTROLS --
  const swanPosition = SWAN_POSITION // [x, y, z]
  const swanRotation = SWAN_ROTATION // [x, y, z] in radians
  const swanScale = SWAN_SCALE // [x, y, z]

  return <primitive object={gltf.scene} position={swanPosition} rotation={swanRotation} scale={swanScale} />
}

function Shells() {
  const gltf = useLoader(GLTFLoader, shellsUrl)

  useEffect(() => {
    applyModelDefaults(gltf.scene)
  }, [gltf])

  // -- SHELLS CONTROLS --
  const shellsPosition = SHELLS_POSITION // [x, y, z]
  const shellsRotation = SHELLS_ROTATION // [x, y, z] in radians
  const shellsScale = SHELLS_SCALE // [x, y, z]

  return <primitive object={gltf.scene} position={shellsPosition} rotation={shellsRotation} scale={shellsScale} />
}

function CameraRig() {
  const { camera } = useThree()
  // Adjust this value to manually rotate on the Z axis (roll)
  const zRotation = 0

  useEffect(() => {
    // Distance ~39, Azimuth 80°, Polar ~81° (PI/2.2)
    const r = 50
    const theta = (80 * Math.PI) / 180
    const phi = Math.PI / 2.1 // Moved camera up (was PI/2.15)

    const x = r * Math.sin(phi) * Math.sin(theta)
    const y = r * Math.cos(phi)
    const z = r * Math.sin(phi) * Math.cos(theta)

    camera.position.set(x, y, z)
    camera.lookAt(0, 10, 0) // Look higher to tilt camera up
    camera.rotateZ(zRotation)
  }, [camera, zRotation])

  return null
}

function RendererConfig() {
  const { gl } = useThree()

  useEffect(() => {
    gl.physicallyCorrectLights = true
    gl.outputEncoding = THREE.sRGBEncoding
    gl.toneMapping = THREE.ACESFilmicToneMapping
    gl.toneMappingExposure = 1.1
    gl.shadowMap.enabled = true
    gl.shadowMap.type = THREE.PCFSoftShadowMap
  }, [gl])

  return null
}

function DustParticles() {
  const pointsRef = useRef(null)
  const count = 400

  const positions = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const areaSize = 120
    const areaDepth = 120
    const areaHeight = 40
    const centerX = DOF_TARGET.x
    const centerY = DOF_TARGET.y + 5
    const centerZ = DOF_TARGET.z

    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      positions[i3] = centerX + (Math.random() - 0.5) * areaSize
      positions[i3 + 1] = centerY + (Math.random() - 0.5) * areaHeight
      positions[i3 + 2] = centerZ + (Math.random() - 0.5) * areaDepth
    }

    return positions
  }, [])

  useFrame((state, delta) => {
    if (!pointsRef.current) return
    const positions = pointsRef.current.geometry.attributes.position.array
    const areaHeight = 40
    const centerY = DOF_TARGET.y + 5

    for (let i = 0; i < positions.length; i += 3) {
      positions[i + 1] += 0.3 * delta
      const maxY = centerY + areaHeight / 2
      const minY = centerY - areaHeight / 2
      if (positions[i + 1] > maxY) positions[i + 1] = minY
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.35}
        sizeAttenuation
        color="#f5f0e6"
        depthWrite={false}
        transparent
        opacity={0.18}
      />
    </points>
  )
}

export default function App() {
  return (
    <Canvas shadows dpr={[1, 2]}>
      <RendererConfig />
      <CameraRig />
      <CustomSky />
      <hemisphereLight intensity={0.35} color="#ffffff" groundColor="#06080a" />
      <ambientLight intensity={0.12} />
      <directionalLight
        castShadow
        position={[30, 60, 15]}
        intensity={2.5}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={1}
        shadow-camera-far={220}
        shadow-camera-left={-90}
        shadow-camera-right={90}
        shadow-camera-top={90}
        shadow-camera-bottom={-90}
        shadow-bias={-0.0002}
        shadow-normalBias={0.02}
      />
      <directionalLight position={[-20, 15, -40]} intensity={0.35} />
      <DustParticles />
      <Suspense fallback={null}>
        <Environment files="/golden_gate_hills_1k.hdr" />
        <Grass />
        <Wyvern />
        <Swan />
        <Shells />
      </Suspense>
      <EffectComposer>
        <DepthOfField
          focusDistance={0}
          focalLength={0.08}
          bokehScale={8}
          height={720}
          target={DOF_TARGET}
        />
      </EffectComposer>
    </Canvas>
  )
}
