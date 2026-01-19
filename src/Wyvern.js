import React, { useRef } from "react"
import { useGLTF } from "@react-three/drei"
import wyvernUrl from "./resources/wyvern-w-material.glb"
import { useMemo, useEffect } from "react"
import gsap from "gsap"

export default function Wyvern(props) {
  const { nodes, materials } = useGLTF(wyvernUrl)

  const topMeshRef = useRef(null)
  const hoverTlRef = useRef(null)
  const baseYRef = useRef(0)

  const lift = useMemo(
    () => ({
      height: 0.05,
      upDuration: 1.5,
      downDuration: 1,
      upEase: "expo.out",
      downEase: "power3.out",
    }),
    [],
  )

  useEffect(() => {
    if (!topMeshRef.current) return
    baseYRef.current = topMeshRef.current.position.y
    return () => {
      hoverTlRef.current?.kill()
    }
  }, [])

  const handleEnter = (e) => {
    e.stopPropagation()
    const mesh = topMeshRef.current
    if (!mesh) return

    hoverTlRef.current?.kill()
    gsap.killTweensOf(mesh.position)

    hoverTlRef.current = gsap.timeline().to(mesh.position, {
      y: baseYRef.current + lift.height,
      duration: lift.upDuration,
      ease: lift.upEase,
    })
  }

  const handleLeave = (e) => {
    e.stopPropagation()
    const mesh = topMeshRef.current
    if (!mesh) return

    hoverTlRef.current?.kill()
    gsap.killTweensOf(mesh.position)

    gsap.to(mesh.position, {
      y: baseYRef.current,
      duration: lift.downDuration,
      ease: lift.downEase,
    })
  }

  return (
    <group {...props} dispose={null} onPointerEnter={handleEnter} onPointerLeave={handleLeave}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.tripo_node_60977bc2.geometry}
        material={materials.Marble}
        position={[0, 0.121, 0]}
        scale={1.264}
        ref={topMeshRef}
      />
      <mesh castShadow receiveShadow geometry={nodes.stand.geometry} material={materials.Marble} position={[0, -0.497, 0]} />
    </group>
  )
}

useGLTF.preload(wyvernUrl)
