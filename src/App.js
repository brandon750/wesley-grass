import React, { Suspense, useEffect } from "react"
import { Canvas, useThree, useLoader } from "@react-three/fiber"
import { Sky as DreiSky, Environment } from "@react-three/drei"
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
  const wyvernPosition = [-12, 21, 0] // [x, y, z]
  const wyvernRotation = [0.015, -0.05, -0.1] // [x, y, z] in radians
  const wyvernScale = [26, 26, 26] // [x, y, z]

  return <primitive object={gltf.scene} position={wyvernPosition} rotation={wyvernRotation} scale={wyvernScale} />
}

function Swan() {
  const gltf = useLoader(GLTFLoader, swanUrl)

  useEffect(() => {
    applyModelDefaults(gltf.scene)
  }, [gltf])

  // -- SWAN CONTROLS --
  const swanPosition = [0, 7, -40] // [x, y, z]
  const swanRotation = [-0.02, -0.75, -0.1] // [x, y, z] in radians
  const swanScale = [20, 20, 20] // [x, y, z]

  return <primitive object={gltf.scene} position={swanPosition} rotation={swanRotation} scale={swanScale} />
}

function Shells() {
  const gltf = useLoader(GLTFLoader, shellsUrl)

  useEffect(() => {
    applyModelDefaults(gltf.scene)
  }, [gltf])

  // -- SHELLS CONTROLS --
  const shellsPosition = [-2, -0.6, 33] // [x, y, z]
  const shellsRotation = [0.1, 0.6, -0.12] // [x, y, z] in radians
  const shellsScale = [14, 14, 14] // [x, y, z]

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
      <Suspense fallback={null}>
        <Environment files="/golden_gate_hills_1k.hdr" />
        <Grass />
        <Wyvern />
        <Swan />
        <Shells />
      </Suspense>
    </Canvas>
  )
}
