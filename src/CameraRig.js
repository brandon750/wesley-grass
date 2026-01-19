import * as THREE from "three"
import { useThree, useFrame } from "@react-three/fiber"
import { useEffect, useMemo, useRef } from "react"

class CameraRigController {
  constructor(camera, options = {}) {
    this.camera = camera
    this.target = options.target || new THREE.Vector3(0, 12, 0)
    this.damping = options.damping || 2
    this.deadZone = options.deadZone ?? 0.15

    this.lookAmplitudeX = options.lookAmplitudeX ?? 2
    this.lookAmplitudeY = options.lookAmplitudeY ?? 1.2

    this.xAmplitude = options.xAmplitude ?? 0
    this.yAmplitude = options.yAmplitude ?? 0

    this.basePosition = camera.position.clone()
    this.baseTarget = this.target.clone()

    const worldUp = new THREE.Vector3(0, 1, 0)
    const forward = this.baseTarget.clone().sub(this.basePosition).normalize()
    const right = forward.clone().cross(worldUp).normalize()
    const up = right.clone().cross(forward).normalize()

    this.baseRight = right
    this.baseUp = up

    this.lookOffset = { x: 0, y: 0 }
    this.pointer = { x: 0, y: 0 }

    this._handleMouseMove = this._handleMouseMove.bind(this)
    window.addEventListener("mousemove", this._handleMouseMove)
  }

  _handleMouseMove(event) {
    this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1
    this.pointer.y = -(event.clientY / window.innerHeight) * 2 + 1
  }

  dispose() {
    window.removeEventListener("mousemove", this._handleMouseMove)
  }

  _deadZoneMap(v) {
    const av = Math.abs(v)
    if (av <= this.deadZone) return 0
    const t = (av - this.deadZone) / (1 - this.deadZone)
    return Math.sign(v) * Math.min(Math.max(t, 0), 1)
  }

  update(delta) {
    const px = this._deadZoneMap(this.pointer.x)
    const py = this._deadZoneMap(this.pointer.y)

    const desiredLookX = px * this.lookAmplitudeX
    const desiredLookY = py * this.lookAmplitudeY

    this.lookOffset.x = THREE.MathUtils.damp(this.lookOffset.x, desiredLookX, this.damping, delta)
    this.lookOffset.y = THREE.MathUtils.damp(this.lookOffset.y, desiredLookY, this.damping, delta)

    const lookAtPoint = this.baseTarget
      .clone()
      .add(this.baseRight.clone().multiplyScalar(this.lookOffset.x))
      .add(this.baseUp.clone().multiplyScalar(this.lookOffset.y))

    if (this.xAmplitude) {
      const targetX = this.basePosition.x + px * this.xAmplitude
      this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, targetX, this.damping, delta)
    }

    if (this.yAmplitude) {
      const targetY = this.basePosition.y + py * this.yAmplitude
      this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, targetY, this.damping, delta)
    }

    this.camera.lookAt(lookAtPoint)
  }
}

export default function CameraRig({ target, damping = 2, lookAmplitudeX = 2, lookAmplitudeY = 1.2, xAmplitude = 0, yAmplitude = 0, deadZone = 0.15 }) {
  const { camera } = useThree()
  const rig = useRef(null)

  const targetVector = useMemo(() => target || new THREE.Vector3(0, 17, 0), [target])

  useEffect(() => {
    const r = 55
    const theta = (80 * Math.PI) / 180
    const phi = Math.PI / 2.1
    const x = r * Math.sin(phi) * Math.sin(theta)
    const y = r * Math.cos(phi)
    const z = r * Math.sin(phi) * Math.cos(theta)
    camera.position.set(x, y, z)
    camera.lookAt(targetVector)
  }, [camera, targetVector])

  useEffect(() => {
    const controller = new CameraRigController(camera, {
      target: targetVector,
      damping,
      lookAmplitudeX,
      lookAmplitudeY,
      xAmplitude,
      yAmplitude,
      deadZone,
    })
    rig.current = controller
    return () => {
      controller.dispose()
      rig.current = null
    }
  }, [camera, targetVector, damping, lookAmplitudeX, lookAmplitudeY, xAmplitude, yAmplitude, deadZone])

  useFrame((_, delta) => {
    if (!rig.current) return
    rig.current.update(delta)
  })

  return null
}
