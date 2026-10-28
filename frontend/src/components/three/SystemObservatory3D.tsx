import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { AnalysisResponse, BottleneckMetric } from '../../types';
import {
  RotateCcw,
  Eye,
  Zap,
  Activity,
  Layers,
  Sparkles,
  Maximize2,
} from 'lucide-react';

interface SystemObservatory3DProps {
  analysis: AnalysisResponse | null;
  selectedMetric: string | null;
  onSelectMetric: (metric: string) => void;
}

interface NodePositionConfig {
  name: string;
  label: string;
  pos: [number, number, number];
  color: string;
  shape: 'box' | 'sphere' | 'octahedron' | 'tetrahedron';
}

const DEFAULT_NODES: NodePositionConfig[] = [
  { name: 'CPU_Utilization', label: 'CPU Utilization', pos: [0, 4.2, 0], color: '#f59e0b', shape: 'octahedron' },
  { name: 'Memory_Usage', label: 'Memory Usage', pos: [-4.6, 0.8, -1.2], color: '#06b6d4', shape: 'box' },
  { name: 'Disk_IO', label: 'Disk I/O', pos: [4.6, 0.8, -1.2], color: '#10b981', shape: 'box' },
  { name: 'Network_Latency', label: 'Network Latency', pos: [0, -1.2, 4.2], color: '#8b5cf6', shape: 'octahedron' },
  { name: 'Response_Time', label: 'Response Time (Target)', pos: [0, -4.2, -1.0], color: '#10b981', shape: 'sphere' },
];

export const SystemObservatory3D: React.FC<SystemObservatory3DProps> = ({
  analysis,
  selectedMetric,
  onSelectMetric,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [showParticles, setShowParticles] = useState<boolean>(true);
  const [hudCoords, setHudCoords] = useState<{ x: number; y: number } | null>(null);

  // Store Three.js instances
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const nodesMapRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const curvePointsRef = useRef<Map<string, THREE.Vector3[]>>(new Map());
  const particlesRef = useRef<Map<string, { points: THREE.Points; tOffsets: Float32Array; curve: THREE.CatmullRomCurve3 }>>(new Map());

  // Mouse drag camera controls state
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const cameraAngleRef = useRef({ theta: 0.3, phi: 1.2, radius: 15.5 });

  // Map bottleneck details
  const bottleneckLookup = useMemo(() => {
    const map = new Map<string, BottleneckMetric>();
    if (analysis) {
      analysis.bottleneck_ranking.forEach((b) => map.set(b.metric, b));
    }
    return map;
  }, [analysis]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth;
    const height = mount.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x07090e);
    scene.fog = new THREE.FogExp2(0x07090e, 0.032);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    cameraRef.current = camera;
    updateCameraPosition();

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0x38bdf8, 0.45);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight1.position.set(10, 20, 15);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x06b6d4, 0.5);
    dirLight2.position.set(-15, -10, -10);
    scene.add(dirLight2);

    const corePointLight = new THREE.PointLight(0x38bdf8, 1.8, 20);
    corePointLight.position.set(0, 0, 0);
    scene.add(corePointLight);

    // 5. Starfield / Floating Dust
    const dustCount = 350;
    const dustGeometry = new THREE.BufferGeometry();
    const dustPositions = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount * 3; i += 3) {
      dustPositions[i] = (Math.random() - 0.5) * 45;
      dustPositions[i + 1] = (Math.random() - 0.5) * 45;
      dustPositions[i + 2] = (Math.random() - 0.5) * 45;
    }
    dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    const dustMaterial = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.12,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
    });
    const dust = new THREE.Points(dustGeometry, dustMaterial);
    scene.add(dust);

    // 6. Central SYSTEM CORE
    const coreGroup = new THREE.Group();
    coreGroup.name = 'SYSTEM_CORE_GROUP';
    scene.add(coreGroup);

    // Core sphere
    const coreGeo = new THREE.SphereGeometry(1.2, 32, 32);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      emissive: 0x0284c7,
      emissiveIntensity: 0.7,
      roughness: 0.2,
      metalness: 0.8,
      wireframe: false,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreMesh.name = 'SYSTEM_CORE';
    coreGroup.add(coreMesh);

    // Core Wireframe cage
    const cageGeo = new THREE.IcosahedronGeometry(1.6, 1);
    const cageMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const cageMesh = new THREE.Mesh(cageGeo, cageMat);
    coreGroup.add(cageMesh);

    // Rotating gimbal rings
    const ringGeo1 = new THREE.TorusGeometry(2.1, 0.03, 16, 64);
    const ringMat1 = new THREE.MeshBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.6 });
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    ring1.rotation.x = Math.PI / 3;
    coreGroup.add(ring1);

    const ringGeo2 = new THREE.TorusGeometry(2.5, 0.025, 16, 64);
    const ringMat2 = new THREE.MeshBasicMaterial({ color: 0x818cf8, transparent: true, opacity: 0.5 });
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.rotation.y = Math.PI / 4;
    coreGroup.add(ring2);

    // 7. Metric Nodes & Dynamic Connections
    nodesMapRef.current.clear();
    curvePointsRef.current.clear();
    particlesRef.current.clear();

    const targetMetricName = analysis?.target_metric || 'Response_Time';

    // Find node positions
    const activeNodes = DEFAULT_NODES.map((cfg) => {
      // Determine color by correlation with target if analyzed
      let color = cfg.color;
      let scale = 1.0;
      if (analysis && cfg.name !== targetMetricName) {
        const b = bottleneckLookup.get(cfg.name);
        if (b) {
          if (b.risk_level === 'HIGH') {
            color = '#f59e0b'; // Amber / Orange
            scale = 1.25;
          } else if (b.risk_level === 'MEDIUM') {
            color = '#06b6d4'; // Cyan
            scale = 1.05;
          } else {
            color = '#64748b'; // Slate / Low
            scale = 0.85;
          }
        }
      } else if (cfg.name === targetMetricName) {
        const health = analysis?.summary.health_status;
        if (health === 'CRITICAL') {
          color = '#ef4444'; // Red when critical bottleneck detected
        } else if (health === 'DEGRADED') {
          color = '#f59e0b'; // Amber when degraded
        } else {
          color = '#10b981'; // Emerald green when optimal / normal
        }
        scale = 1.35;
      }
      return { ...cfg, activeColor: color, activeScale: scale };
    });

    activeNodes.forEach((nodeCfg) => {
      const nodeGroup = new THREE.Group();
      nodeGroup.position.set(...nodeCfg.pos);

      let geo: THREE.BufferGeometry;
      if (nodeCfg.shape === 'box') {
        geo = new THREE.BoxGeometry(1.0, 1.0, 1.0);
      } else if (nodeCfg.shape === 'octahedron') {
        geo = new THREE.OctahedronGeometry(0.85, 0);
      } else {
        geo = new THREE.SphereGeometry(0.85, 24, 24);
      }

      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(nodeCfg.activeColor),
        emissive: new THREE.Color(nodeCfg.activeColor),
        emissiveIntensity: 0.45,
        roughness: 0.3,
        metalness: 0.7,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.name = nodeCfg.name;
      mesh.scale.setScalar(nodeCfg.activeScale);
      nodeGroup.add(mesh);

      // Outer glowing halo ring
      const haloGeo = new THREE.RingGeometry(0.95, 1.15, 32);
      const haloMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(nodeCfg.activeColor),
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.45,
      });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      halo.lookAt(0, 0, 0);
      nodeGroup.add(halo);

      scene.add(nodeGroup);
      nodesMapRef.current.set(nodeCfg.name, mesh);
    });

    // 8. Construct Dynamic Spline Tubes & Particle Streams
    const targetNodeCfg = activeNodes.find((n) => n.name === targetMetricName) || activeNodes[4];
    const targetPos = new THREE.Vector3(...targetNodeCfg.pos);

    activeNodes.forEach((nodeCfg) => {
      if (nodeCfg.name === targetMetricName) return;

      const nodePos = new THREE.Vector3(...nodeCfg.pos);
      // Mid control point arched slightly outward
      const midPoint = new THREE.Vector3()
        .addVectors(nodePos, targetPos)
        .multiplyScalar(0.5)
        .add(new THREE.Vector3((Math.random() - 0.5) * 1.5, 0.8, (Math.random() - 0.5) * 1.5));

      const curve = new THREE.CatmullRomCurve3([nodePos, midPoint, targetPos]);
      const curvePoints = curve.getPoints(50);
      curvePointsRef.current.set(nodeCfg.name, curvePoints);

      // Compute correlation metrics for tube width & brightness
      const bInfo = bottleneckLookup.get(nodeCfg.name);
      const rVal = bInfo ? bInfo.pearson_r : 0.5;
      const absR = Math.abs(rVal);

      // Tube geometry
      const tubeRadius = Math.max(0.02, 0.03 + absR * 0.08);
      const tubeGeo = new THREE.TubeGeometry(curve, 32, tubeRadius, 8, false);

      let tubeColor = 0x64748b;
      if (rVal >= 0.7) tubeColor = 0xef4444;
      else if (rVal >= 0.4) tubeColor = 0xf59e0b;
      else if (rVal <= -0.4) tubeColor = 0x8b5cf6;
      else if (absR >= 0.2) tubeColor = 0x06b6d4;

      const tubeMat = new THREE.MeshStandardMaterial({
        color: tubeColor,
        emissive: tubeColor,
        emissiveIntensity: 0.35 + absR * 0.45,
        transparent: true,
        opacity: 0.65 + absR * 0.3,
        roughness: 0.2,
      });
      const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
      scene.add(tubeMesh);

      // Energy particles flowing along this spline
      const pCount = Math.max(12, Math.round(15 + absR * 35));
      const pGeo = new THREE.BufferGeometry();
      const pPositions = new Float32Array(pCount * 3);
      const tOffsets = new Float32Array(pCount);

      for (let i = 0; i < pCount; i++) {
        tOffsets[i] = i / pCount;
        const pt = curve.getPoint(tOffsets[i]);
        pPositions[i * 3] = pt.x;
        pPositions[i * 3 + 1] = pt.y;
        pPositions[i * 3 + 2] = pt.z;
      }

      pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
      const pMat = new THREE.PointsMaterial({
        color: tubeColor,
        size: 0.25 + absR * 0.25,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
      });

      const pMesh = new THREE.Points(pGeo, pMat);
      scene.add(pMesh);
      particlesRef.current.set(nodeCfg.name, { points: pMesh, tOffsets, curve });
    });

    // Also connect each node to central SYSTEM CORE
    activeNodes.forEach((nodeCfg) => {
      const nodePos = new THREE.Vector3(...nodeCfg.pos);
      const corePos = new THREE.Vector3(0, 0, 0);
      const lineGeo = new THREE.BufferGeometry().setFromPoints([corePos, nodePos]);
      const lineMat = new THREE.LineBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.22,
      });
      const line = new THREE.Line(lineGeo, lineMat);
      scene.add(line);
    });

    // 9. Raycasting for Mouse Interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleMouseMove = (event: MouseEvent) => {
      const rect = mount.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / mount.clientWidth) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / mount.clientHeight) * 2 + 1;

      // Camera drag handling
      if (isDraggingRef.current) {
        const deltaX = event.clientX - previousMousePositionRef.current.x;
        const deltaY = event.clientY - previousMousePositionRef.current.y;

        cameraAngleRef.current.theta -= deltaX * 0.007;
        cameraAngleRef.current.phi = Math.max(
          0.1,
          Math.min(Math.PI - 0.1, cameraAngleRef.current.phi + deltaY * 0.007)
        );
        updateCameraPosition();
      }
      previousMousePositionRef.current = { x: event.clientX, y: event.clientY };

      // Raycast against nodes
      if (cameraRef.current) {
        raycaster.setFromCamera(mouse, cameraRef.current);
        const meshes = Array.from(nodesMapRef.current.values());
        const intersects = raycaster.intersectObjects(meshes);

        if (intersects.length > 0) {
          const hitMesh = intersects[0].object as THREE.Mesh;
          setHoveredNode(hitMesh.name);

          // Project 3D coordinate to 2D screen coordinate for HUD billboard
          const worldPos = new THREE.Vector3();
          hitMesh.getWorldPosition(worldPos);
          worldPos.project(cameraRef.current);

          const screenX = ((worldPos.x + 1) * mount.clientWidth) / 2;
          const screenY = ((-worldPos.y + 1) * mount.clientHeight) / 2;
          setHudCoords({ x: screenX, y: screenY });
        } else {
          setHoveredNode(null);
          setHudCoords(null);
        }
      }
    };

    const handleMouseDown = (event: MouseEvent) => {
      if (event.button === 0) {
        isDraggingRef.current = true;
        previousMousePositionRef.current = { x: event.clientX, y: event.clientY };
      }
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    const handleClick = () => {
      if (hoveredNode) {
        onSelectMetric(hoveredNode);
      }
    };

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      cameraAngleRef.current.radius = Math.max(
        7.0,
        Math.min(30.0, cameraAngleRef.current.radius + event.deltaY * 0.015)
      );
      updateCameraPosition();
    };

    const handleResize = () => {
      if (!mount || !rendererRef.current || !cameraRef.current) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    mount.addEventListener('mousemove', handleMouseMove);
    mount.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    mount.addEventListener('click', handleClick);
    mount.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('resize', handleResize);

    // 10. Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Slow auto rotate camera if enabled and not user dragging
      if (autoRotate && !isDraggingRef.current) {
        cameraAngleRef.current.theta += delta * 0.12;
        updateCameraPosition();
      }

      // Rotate central core
      coreGroup.rotation.y = elapsed * 0.25;
      coreGroup.rotation.z = Math.sin(elapsed * 0.5) * 0.1;
      ring1.rotation.z = elapsed * 0.6;
      ring2.rotation.x = elapsed * -0.4;
      cageMesh.rotation.y = -elapsed * 0.3;

      // Animate floating dust
      dust.rotation.y = elapsed * 0.02;

      // Animate individual node meshes
      nodesMapRef.current.forEach((mesh, name) => {
        mesh.rotation.y += delta * 0.8;
        mesh.rotation.x += delta * 0.4;

        // Pulse scale if hovered or selected
        const isTarget = name === selectedMetric || name === hoveredNode;
        const targetScale = isTarget ? 1.4 : (name === targetMetricName ? 1.3 : 1.0);
        mesh.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
      });

      // Animate energy particles along splines
      if (showParticles) {
        particlesRef.current.forEach(({ points, tOffsets, curve }, metricName) => {
          const bInfo = bottleneckLookup.get(metricName);
          const speed = 0.2 + (bInfo ? Math.abs(bInfo.pearson_r) * 0.6 : 0.25);
          const posAttr = points.geometry.attributes.position as THREE.BufferAttribute;
          const posArr = posAttr.array as Float32Array;

          for (let i = 0; i < tOffsets.length; i++) {
            tOffsets[i] = (tOffsets[i] + delta * speed) % 1.0;
            const pt = curve.getPoint(tOffsets[i]);
            posArr[i * 3] = pt.x;
            posArr[i * 3 + 1] = pt.y;
            posArr[i * 3 + 2] = pt.z;
          }
          posAttr.needsUpdate = true;
        });
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      mount.removeEventListener('mousemove', handleMouseMove);
      mount.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      mount.removeEventListener('click', handleClick);
      mount.removeEventListener('wheel', handleWheel);
      window.removeEventListener('resize', handleResize);
      if (mount && renderer.domElement) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [analysis, bottleneckLookup, showParticles]);

  function updateCameraPosition() {
    if (!cameraRef.current) return;
    const { theta, phi, radius } = cameraAngleRef.current;
    const x = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.cos(theta);
    cameraRef.current.position.set(x, y, z);
    cameraRef.current.lookAt(0, 0, 0);
  }

  const handleResetCamera = () => {
    cameraAngleRef.current = { theta: 0.3, phi: 1.2, radius: 15.5 };
    updateCameraPosition();
  };

  // Hovered node metadata
  const hoveredStats = hoveredNode && analysis?.metric_stats ? analysis.metric_stats[hoveredNode] : null;
  const hoveredBottleneck = hoveredNode ? bottleneckLookup.get(hoveredNode) : null;
  const isTargetMetric = hoveredNode === (analysis?.target_metric || 'Response_Time');

  return (
    <div className="relative w-full h-[520px] rounded-2xl overflow-hidden glass-panel-glow border border-cyan-500/20 bg-[#07090e] shadow-2xl flex flex-col">
      {/* 3D Viewport Header Overlay */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 backdrop-blur-md border border-cyan-500/30 text-xs font-mono text-cyan-300">
          <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>3D SYSTEM OBSERVATORY</span>
        </div>
        <span className="text-xs text-slate-400 hidden sm:inline">
          Click nodes to inspect scatter & correlation
        </span>
      </div>

      {/* Floating Viewport Controls */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-slate-900/85 backdrop-blur-md px-2 py-1.5 rounded-xl border border-slate-700/60 shadow-lg">
        <button
          onClick={() => setAutoRotate(!autoRotate)}
          title="Toggle Auto Rotation"
          className={`p-1.5 rounded-lg text-xs font-medium transition-all ${
            autoRotate
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setShowParticles(!showParticles)}
          title="Toggle Dynamic Energy Flow"
          className={`p-1.5 rounded-lg text-xs font-medium transition-all ${
            showParticles
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleResetCamera}
          title="Reset Camera Perspective"
          className="p-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white transition-all"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 3D Legend Bar */}
      <div className="absolute bottom-3 left-4 z-20 flex items-center gap-4 bg-slate-950/75 backdrop-blur-md px-3.5 py-1.5 rounded-lg border border-slate-800 text-[11px] text-slate-300">
        <span className="text-slate-400 font-mono text-[10px] uppercase">Correlation:</span>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_#ef4444]" />
          <span>High Risk (r &gt; 0.7)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#06b6d4]" />
          <span>Moderate (r ~ 0.5)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-500" />
          <span>Low/Negligible</span>
        </div>
      </div>

      {/* Main Three.js Container */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Futuristic Hover HUD Card */}
      {hoveredNode && hudCoords && (
        <div
          style={{
            position: 'absolute',
            left: `${Math.min(hudCoords.x + 15, mountRef.current?.clientWidth ? mountRef.current.clientWidth - 260 : 300)}px`,
            top: `${Math.max(hudCoords.y - 40, 20)}px`,
            pointerEvents: 'none',
          }}
          className="z-30 w-64 bg-slate-900/95 backdrop-blur-xl border border-cyan-500/50 rounded-xl p-3 shadow-2xl shadow-cyan-950/50 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
            <span className="text-xs font-mono font-bold text-cyan-300 truncate">
              {hoveredNode.replace('_', ' ')}
            </span>
            {isTargetMetric ? (
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                  analysis?.summary.health_status === 'CRITICAL'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : analysis?.summary.health_status === 'DEGRADED'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                }`}
              >
                TARGET
              </span>
            ) : hoveredBottleneck ? (
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                  hoveredBottleneck.risk_level === 'HIGH'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : hoveredBottleneck.risk_level === 'MEDIUM'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                }`}
              >
                {hoveredBottleneck.risk_level} RISK
              </span>
            ) : null}
          </div>

          {hoveredStats && (
            <div className="grid grid-cols-2 gap-2 text-[11px] mb-2 font-mono">
              <div className="bg-slate-800/60 p-1.5 rounded">
                <div className="text-slate-400 text-[9px]">MEAN</div>
                <div className="font-semibold text-white">
                  {hoveredStats.mean} {hoveredStats.unit}
                </div>
              </div>
              <div className="bg-slate-800/60 p-1.5 rounded">
                <div className="text-slate-400 text-[9px]">P95 PEAK</div>
                <div className="font-semibold text-white">
                  {hoveredStats.p95} {hoveredStats.unit}
                </div>
              </div>
            </div>
          )}

          {!isTargetMetric && hoveredBottleneck && (
            <div className="space-y-1 text-[11px] font-mono border-t border-slate-800/80 pt-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Pearson r:</span>
                <span className="font-bold text-amber-300">
                  {hoveredBottleneck.pearson_r > 0 ? '+' : ''}
                  {hoveredBottleneck.pearson_r.toFixed(3)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Spearman ρ:</span>
                <span className="font-bold text-cyan-300">
                  {hoveredBottleneck.spearman_rho > 0 ? '+' : ''}
                  {hoveredBottleneck.spearman_rho.toFixed(3)}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 pt-1 leading-snug">
                {hoveredBottleneck.strength} {hoveredBottleneck.direction} relationship
              </div>
            </div>
          )}

          <div className="mt-2 text-[9px] text-cyan-400/80 font-mono text-center">
            Click to focus scatter & matrix
          </div>
        </div>
      )}
    </div>
  );
};
