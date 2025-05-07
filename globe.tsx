"use client"

import { useRef, useState, useEffect, useMemo } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import * as THREE from "three"
import * as dat from "dat.gui"

export default function WireframeSphereWithGUI() {
    return (
        <div className="w-full h-screen bg-black relative">
            <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
                <ambientLight intensity={0.8} />
                <directionalLight position={[10, 10, 5]} intensity={1} />
                <SphereWithControls />
                <OrbitControls enableZoom={true} enablePan={false} minDistance={3} maxDistance={10} />
            </Canvas>
        </div>
    )
}

// Configuration object to be controlled by dat.GUI
const config = {
    isRotating: true,
    rotationSpeed: 0.1,
    numStripes: 8,
    ringThickness: 0.04, // New property for ring thickness
    showWireframe: true,
    showNodes: false,
    nodeSize: 0.05,
    nodeInterval: 1, // Show every nth node
    nodeShape: "sphere", // sphere, box, or tetrahedron
    polarSizeVariation: false,
    polarSizeMultiplier: 3.0, // Maximum size multiplier at poles
    polarColoring: true,
    equatorColor: "#ffffff", // White for equator
    poleColor: "#555555", // Gray for poles
    wireframeSegments: 24,
    connectionType: "none", // none, horizontal, vertical
    connectionThickness: 0.01,
    // Inner sphere options
    showInnerSphere: false,
    innerSphereRatio: 0.3, // Size of inner sphere relative to outer sphere
    innerSphereWireframe: true,
    connectToInnerSphere: false,
    innerSphereConnectionColor: "#ffffff",
    innerSphereConnectionOpacity: 0.3,
    takeScreenshot: () => { }, // This will be defined later
}

function SphereWithControls() {
    const groupRef = useRef<THREE.Group>(null)
    const sphereRef = useRef<THREE.Mesh>(null)
    const guiRef = useRef<dat.GUI | null>(null)
    const sphereRadius = 2
    const innerSphereRadius = sphereRadius * config.innerSphereRatio

    // Get access to the Three.js renderer, scene, and camera
    const { gl, scene, camera } = useThree()

    // State to force re-render when config changes
    const [_, forceUpdate] = useState(0)

    // Define the screenshot function with improved centering
    const takeScreenshot = () => {
        // Create a new scene for the screenshot to avoid modifying the original
        const screenshotScene = new THREE.Scene()
        screenshotScene.background = new THREE.Color(0x000000) // Black background

        // Clone the group to avoid modifying the original
        const clonedGroup = groupRef.current.clone()

        // Reset rotation to show the sphere from a standard angle
        clonedGroup.rotation.set(0, 0, 0)

        // Add the cloned group to the screenshot scene
        screenshotScene.add(clonedGroup)

        // Create a new camera specifically for the screenshot
        const screenshotCamera = new THREE.PerspectiveCamera(30, 1, 0.1, 1000)

        // Position camera to capture the whole sphere
        // Calculate the optimal camera distance based on sphere radius and field of view
        const fov = 30 * (Math.PI / 180) // Convert to radians
        const cameraDistance = (sphereRadius * 2.5) / Math.sin(fov / 2)
        screenshotCamera.position.set(0, 0, cameraDistance)
        screenshotCamera.lookAt(0, 0, 0)

        // Set renderer to a high-resolution square
        const originalSize = {
            width: gl.domElement.width,
            height: gl.domElement.height,
        }

        // Use a high resolution for the screenshot
        const resolution = 2048
        gl.setSize(resolution, resolution)

        // Clear any previous renders
        gl.clear()

        // Render the scene
        gl.render(screenshotScene, screenshotCamera)

        // Get the image data as PNG
        const imgData = gl.domElement.toDataURL("image/png")

        // Create a link element to download the image
        const link = document.createElement("a")
        link.href = imgData
        link.download = "wireframe-sphere-" + new Date().toISOString().slice(0, 19).replace(/:/g, "-") + ".png"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        // Restore the original renderer size
        gl.setSize(originalSize.width, originalSize.height)

        // Dispose of temporary objects
        screenshotScene.remove(clonedGroup)
        clonedGroup.traverse((object) => {
            if (object instanceof THREE.Mesh) {
                object.geometry.dispose()
                if (object.material.dispose) {
                    object.material.dispose()
                }
            }
        })
    }

    // Assign the screenshot function to the config
    config.takeScreenshot = takeScreenshot

    // Set up dat.GUI - with improved cleanup
    useEffect(() => {
        // Create new GUI only if it doesn't exist
        if (!guiRef.current) {
            const gui = new dat.GUI({ width: 300 })
            guiRef.current = gui

            // Add controls
            const rotationFolder = gui.addFolder("Rotation")
            rotationFolder.add(config, "isRotating").name("Enable Rotation")
            rotationFolder.add(config, "rotationSpeed", 0.01, 0.5).name("Speed")
            rotationFolder.open()

            const sphereFolder = gui.addFolder("Sphere")
            sphereFolder
                .add(config, "showWireframe")
                .name("Show Wireframe")
                .onChange(() => forceUpdate((prev) => prev + 1))
            sphereFolder
                .add(config, "wireframeSegments", 8, 48, 4)
                .name("Wireframe Detail")
                .onChange(() => forceUpdate((prev) => prev + 1))
            sphereFolder.open()

            const stripeFolder = gui.addFolder("Stripes")
            stripeFolder
                .add(config, "numStripes", 0, 20, 1)
                .name("Number of Rings")
                .onChange(() => forceUpdate((prev) => prev + 1))
            stripeFolder
                .add(config, "ringThickness", 0.01, 0.2)
                .name("Ring Thickness")
                .onChange(() => forceUpdate((prev) => prev + 1))
            stripeFolder.open()

            const nodeFolder = gui.addFolder("Nodes")
            nodeFolder
                .add(config, "showNodes")
                .name("Show Nodes")
                .onChange(() => forceUpdate((prev) => prev + 1))
            nodeFolder
                .add(config, "nodeSize", 0.01, 0.2)
                .name("Base Size")
                .onChange(() => forceUpdate((prev) => prev + 1))
            nodeFolder
                .add(config, "polarSizeVariation")
                .name("Polar Size Variation")
                .onChange(() => forceUpdate((prev) => prev + 1))
            nodeFolder
                .add(config, "polarSizeMultiplier", 1, 5)
                .name("Polar Size Multiplier")
                .onChange(() => forceUpdate((prev) => prev + 1))
            nodeFolder
                .add(config, "nodeInterval", 1, 10, 1)
                .name("Node Interval")
                .onChange(() => forceUpdate((prev) => prev + 1))
            nodeFolder
                .add(config, "nodeShape", ["sphere", "box", "tetrahedron"])
                .name("Node Shape")
                .onChange(() => forceUpdate((prev) => prev + 1))
            nodeFolder.open()

            const colorFolder = gui.addFolder("Node Colors")
            colorFolder
                .add(config, "polarColoring")
                .name("Polar-based Colors")
                .onChange(() => forceUpdate((prev) => prev + 1))
            colorFolder
                .addColor(config, "equatorColor")
                .name("Equator Color")
                .onChange(() => forceUpdate((prev) => prev + 1))
            colorFolder
                .addColor(config, "poleColor")
                .name("Pole Color")
                .onChange(() => forceUpdate((prev) => prev + 1))
            colorFolder.open()

            const connectionFolder = gui.addFolder("Connections")
            connectionFolder
                .add(config, "connectionType", ["none", "horizontal", "vertical"])
                .name("Connection Type")
                .onChange(() => forceUpdate((prev) => prev + 1))
            connectionFolder
                .add(config, "connectionThickness", 0.001, 0.05)
                .name("Connection Thickness")
                .onChange(() => forceUpdate((prev) => prev + 1))
            connectionFolder.open()

            // Add inner sphere controls
            const innerSphereFolder = gui.addFolder("Inner Sphere")
            innerSphereFolder
                .add(config, "showInnerSphere")
                .name("Show Inner Sphere")
                .onChange(() => forceUpdate((prev) => prev + 1))
            innerSphereFolder
                .add(config, "innerSphereRatio", 0.1, 0.8)
                .name("Inner Sphere Size")
                .onChange(() => forceUpdate((prev) => prev + 1))
            innerSphereFolder
                .add(config, "innerSphereWireframe")
                .name("Inner Wireframe")
                .onChange(() => forceUpdate((prev) => prev + 1))
            innerSphereFolder
                .add(config, "connectToInnerSphere")
                .name("Connect to Inner")
                .onChange(() => forceUpdate((prev) => prev + 1))
            innerSphereFolder
                .addColor(config, "innerSphereConnectionColor")
                .name("Connection Color")
                .onChange(() => forceUpdate((prev) => prev + 1))
            innerSphereFolder
                .add(config, "innerSphereConnectionOpacity", 0, 1)
                .name("Connection Opacity")
                .onChange(() => forceUpdate((prev) => prev + 1))
            innerSphereFolder.open()

            // Add screenshot button
            gui.add(config, "takeScreenshot").name("📷 Take Screenshot")

            // Position the GUI in the top-right corner
            gui.domElement.style.position = "absolute"
            gui.domElement.style.top = "10px"
            gui.domElement.style.right = "10px"
        }

        // Clean up on unmount - with safer cleanup
        return () => {
            // Only destroy if the GUI exists and we're actually unmounting
            // (not just re-rendering)
            if (guiRef.current) {
                try {
                    // Store reference to the GUI before nullifying it
                    const gui = guiRef.current
                    // Clear the reference first
                    guiRef.current = null
                    // Then destroy the GUI
                    gui.destroy()
                } catch (e) {
                    console.error("Error cleaning up GUI:", e)
                }
            }
        }
    }, []) // Empty dependency array means this only runs on mount/unmount

    useFrame((state, delta) => {
        if (groupRef.current && config.isRotating) {
            groupRef.current.rotation.y += delta * config.rotationSpeed
            groupRef.current.rotation.x += delta * (config.rotationSpeed / 2)
        }
    })

    // Create the stripes at regular intervals
    const stripes = useMemo(() => {
        return Array.from({ length: config.numStripes }, (_, i) => {
            const angle = (i * Math.PI) / config.numStripes
            return (
                <mesh key={`stripe-${i}`} rotation={[angle, 0, Math.PI / 4]}>
                    <torusGeometry args={[sphereRadius, config.ringThickness, 16, 100]} />
                    <meshBasicMaterial color="#ffffff" />
                </mesh>
            )
        })
    }, [config.numStripes, config.ringThickness, sphereRadius])

    // Generate nodes, connections, and inner sphere connections
    const { nodes, connections, innerSphereConnections } = useMemo(() => {
        // If nodes are not shown, return null for all
        if (!config.showNodes) return { nodes: null, connections: null, innerSphereConnections: null }

        // Create a temporary sphere geometry to get vertices
        const tempGeometry = new THREE.SphereGeometry(sphereRadius, config.wireframeSegments, config.wireframeSegments)

        // Get vertices from the geometry
        const vertices = []
        const positionAttribute = tempGeometry.getAttribute("position")

        for (let i = 0; i < positionAttribute.count; i += config.nodeInterval) {
            vertices.push(new THREE.Vector3(positionAttribute.getX(i), positionAttribute.getY(i), positionAttribute.getZ(i)))
        }

        // Parse the hex colors to get RGB values
        const equatorColorHex = config.equatorColor
        const poleColorHex = config.poleColor

        // Convert hex to RGB
        const equatorColor = new THREE.Color(equatorColorHex)
        const poleColor = new THREE.Color(poleColorHex)

        // Create a shape at each vertex
        const nodeElements = vertices.map((vertex, i) => {
            // Calculate size based on proximity to poles if enabled
            let sizeMultiplier = 1
            if (config.polarSizeVariation) {
                // Calculate normalized distance from equator (0 at equator, 1 at poles)
                const normalizedY = Math.abs(vertex.y) / sphereRadius
                // Apply size multiplier based on distance from equator
                sizeMultiplier = 1 + (config.polarSizeMultiplier - 1) * normalizedY
            }

            // Apply the size multiplier
            const nodeSize = config.nodeSize * sizeMultiplier

            // Calculate color based on proximity to poles if enabled
            let nodeColor = "#ffffff" // Default white
            if (config.polarColoring) {
                // Calculate normalized distance from equator (0 at equator, 1 at poles)
                const normalizedY = Math.abs(vertex.y) / sphereRadius

                // Create a color that interpolates between equator and pole colors
                const color = new THREE.Color()
                color.copy(equatorColor).lerp(poleColor, normalizedY)

                // Convert to hex
                nodeColor = "#" + color.getHexString()
            }

            let geometry
            switch (config.nodeShape) {
                case "box":
                    geometry = <boxGeometry args={[nodeSize, nodeSize, nodeSize]} />
                    break
                case "tetrahedron":
                    geometry = <tetrahedronGeometry args={[nodeSize * 1.5, 0]} />
                    break
                case "sphere":
                default:
                    geometry = <sphereGeometry args={[nodeSize, 8, 8]} />
                    break
            }

            return (
                <mesh key={`node-${i}`} position={[vertex.x, vertex.y, vertex.z]}>
                    {geometry}
                    <meshBasicMaterial color={nodeColor} />
                </mesh>
            )
        })

        // Create connections between nodes if enabled
        let connectionElements = null
        if (config.connectionType !== "none" && vertices.length > 0) {
            const connectionPairs = []
            const tolerance = 0.1 // Tolerance for considering points aligned

            if (config.connectionType === "horizontal") {
                // Connect nodes with similar y-coordinates
                for (let i = 0; i < vertices.length; i++) {
                    for (let j = i + 1; j < vertices.length; j++) {
                        const v1 = vertices[i]
                        const v2 = vertices[j]

                        // Check if they're in the same horizontal plane (similar y-value)
                        if (Math.abs(v1.y - v2.y) < tolerance) {
                            // Check if they're close enough to be connected
                            // We don't want to connect points on opposite sides of the sphere
                            const distance = v1.distanceTo(v2)
                            if (distance < sphereRadius) {
                                connectionPairs.push([v1, v2])
                            }
                        }
                    }
                }
            } else if (config.connectionType === "vertical") {
                // Connect nodes with similar x,z coordinates but different y
                for (let i = 0; i < vertices.length; i++) {
                    for (let j = i + 1; j < vertices.length; j++) {
                        const v1 = vertices[i]
                        const v2 = vertices[j]

                        // Project points onto xz-plane and check if they're close
                        const xzDistance = Math.sqrt(Math.pow(v1.x - v2.x, 2) + Math.pow(v1.z - v2.z, 2))

                        // Check if they're in the same vertical line (similar x,z values)
                        if (xzDistance < tolerance) {
                            // Check if they're close enough to be connected
                            const distance = v1.distanceTo(v2)
                            if (distance < sphereRadius) {
                                connectionPairs.push([v1, v2])
                            }
                        }
                    }
                }
            }

            // Create line segments for connections
            connectionElements = connectionPairs.map((pair, i) => {
                const [start, end] = pair

                // Create a geometry for the connection
                const points = [new THREE.Vector3(start.x, start.y, start.z), new THREE.Vector3(end.x, end.y, end.z)]

                const lineGeometry = new THREE.BufferGeometry().setFromPoints(points)

                return (
                    <line key={`connection-${i}`} geometry={lineGeometry}>
                        <lineBasicMaterial color="#ffffff" linewidth={config.connectionThickness} />
                    </line>
                )
            })
        }

        // Create connections from nodes to inner sphere if enabled
        let innerSphereConnectionElements = null
        if (config.connectToInnerSphere && config.showInnerSphere && vertices.length > 0) {
            // Create line segments for connections to inner sphere
            innerSphereConnectionElements = vertices.map((vertex, i) => {
                // Calculate direction from vertex to center (0,0,0)
                const direction = new THREE.Vector3().copy(vertex).normalize()

                // Calculate inner sphere intersection point
                const innerPoint = direction.clone().multiplyScalar(innerSphereRadius)

                // Create a geometry for the connection
                const points = [vertex.clone(), innerPoint]
                const lineGeometry = new THREE.BufferGeometry().setFromPoints(points)

                // Parse the connection color
                const connectionColor = new THREE.Color(config.innerSphereConnectionColor)

                return (
                    <line key={`inner-connection-${i}`} geometry={lineGeometry}>
                        <lineBasicMaterial
                            color={connectionColor}
                            transparent={true}
                            opacity={config.innerSphereConnectionOpacity}
                            linewidth={config.connectionThickness / 2}
                        />
                    </line>
                )
            })
        }

        return {
            nodes: nodeElements,
            connections: connectionElements,
            innerSphereConnections: innerSphereConnectionElements,
        }
    }, [
        config.showNodes,
        config.nodeSize,
        config.nodeInterval,
        config.nodeShape,
        config.wireframeSegments,
        config.connectionType,
        config.connectionThickness,
        config.polarSizeVariation,
        config.polarSizeMultiplier,
        config.polarColoring,
        config.equatorColor,
        config.poleColor,
        config.showInnerSphere,
        config.innerSphereRatio,
        config.connectToInnerSphere,
        config.innerSphereConnectionColor,
        config.innerSphereConnectionOpacity,
        sphereRadius,
        innerSphereRadius,
    ])

    return (
        <group ref={groupRef}>
            {/* Wireframe Sphere - conditionally rendered */}
            {config.showWireframe && (
                <mesh ref={sphereRef}>
                    <sphereGeometry args={[sphereRadius, config.wireframeSegments, config.wireframeSegments]} />
                    <meshBasicMaterial color="#ffffff" wireframe={true} />
                </mesh>
            )}

            {/* Inner Sphere - conditionally rendered */}
            {config.showInnerSphere && (
                <mesh>
                    <sphereGeometry args={[innerSphereRadius, config.wireframeSegments, config.wireframeSegments]} />
                    <meshBasicMaterial
                        color="#ffffff"
                        wireframe={config.innerSphereWireframe}
                        opacity={config.innerSphereWireframe ? 1 : 0.3}
                        transparent={!config.innerSphereWireframe}
                    />
                </mesh>
            )}

            {/* Stripes */}
            {stripes}

            {/* Nodes */}
            {nodes}

            {/* Connections between nodes */}
            {connections}

            {/* Connections to inner sphere */}
            {innerSphereConnections}
        </group>
    )
}

