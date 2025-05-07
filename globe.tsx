"use client"

import { useRef } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import type * as THREE from "three"

export default function WireframeSphereWithStripes() {
    return (
        <div className="w-full h-screen bg-black">
            <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
                <ambientLight intensity={0.8} />
                <directionalLight position={[10, 10, 5]} intensity={1} />
                <SphereWithStripes />
                <OrbitControls
                    enableZoom={true}
                    enablePan={false}
                    minDistance={3}
                    maxDistance={10}
                    autoRotate
                    autoRotateSpeed={0.5}
                />
            </Canvas>
        </div>
    )
}

function SphereWithStripes() {
    const groupRef = useRef<THREE.Group>(null)
    const sphereRadius = 2
    const numStripes = 8 // Number of stripes to create

    // Array of colors for the stripes
    // const colors = [
    //   "#00ffff", // Cyan
    //   "#ff00ff", // Magenta
    //   "#ffff00", // Yellow
    //   "#00ff00", // Green
    //   "#ff0000", // Red
    //   "#0000ff", // Blue
    //   "#ff8000", // Orange
    //   "#8000ff", // Purple
    // ]

    useFrame((state, delta) => {
        if (groupRef.current) {
            // Rotate the entire group to keep the sphere and stripes together
            groupRef.current.rotation.y += delta * 0.1
            groupRef.current.rotation.x += delta * 0.05
        }
    })

    // Create the stripes at regular intervals
    const stripes = Array.from({ length: numStripes }, (_, i) => {
        const angle = (i * Math.PI) / numStripes
        return (
            <mesh key={i} rotation={[angle, 0, Math.PI / 4]}>
                <torusGeometry args={[sphereRadius, 0.04, 16, 100]} />
                <meshBasicMaterial color="#ffffff" />
            </mesh>
        )
    })

    return (
        <group ref={groupRef}>
            {/* Wireframe Sphere */}
            <mesh>
                <sphereGeometry args={[sphereRadius, 24, 24]} />
                <meshBasicMaterial color="#ffffff" wireframe={true} />
            </mesh>

            {/* Multiple Stripes */}
            {stripes}
        </group>
    )
}
