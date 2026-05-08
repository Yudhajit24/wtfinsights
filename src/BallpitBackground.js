/**
 * BallpitBackground Component
 * 
 * A high-performance 3D background featuring interactive spheres that react to gravity,
 * friction, and user interaction. Uses Three.js InstancedMesh for rendering efficiency
 * and a custom physical material for advanced lighting effects.
 */

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { gsap } from 'gsap';
import { Observer } from 'gsap/Observer';

gsap.registerPlugin(Observer);

// --- Custom Material for Subsurface Scattering-like effect ---
class PhysicalScatteringMaterial extends THREE.MeshPhysicalMaterial {
  uniforms = {
    thicknessDistortion: { value: 0.1 },
    thicknessAmbient: { value: 0 },
    thicknessAttenuation: { value: 0.1 },
    thicknessPower: { value: 2 },
    thicknessScale: { value: 10 }
  };

  constructor(params) {
    super(params);
    this.defines = { USE_UV: '' };
    this.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, this.uniforms);
      shader.fragmentShader = `
        uniform float thicknessPower;
        uniform float thicknessScale;
        uniform float thicknessDistortion;
        uniform float thicknessAmbient;
        uniform float thicknessAttenuation;
        ${shader.fragmentShader}
      `;
      
      shader.fragmentShader = shader.fragmentShader.replace(
        'void main() {',
        `
        void RE_Direct_Scattering(const in IncidentLight directLight, const in vec2 uv, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, inout ReflectedLight reflectedLight) {
          vec3 scatteringHalf = normalize(directLight.direction + (geometryNormal * thicknessDistortion));
          float scatteringDot = pow(saturate(dot(geometryViewDir, -scatteringHalf)), thicknessPower) * thicknessScale;
          #ifdef USE_COLOR
            vec3 scatteringIllu = (scatteringDot + thicknessAmbient) * vColor;
          #else
            vec3 scatteringIllu = (scatteringDot + thicknessAmbient) * diffuse;
          #endif
          reflectedLight.directDiffuse += scatteringIllu * thicknessAttenuation * directLight.color;
        }
        void main() {
        `
      );

      const lightsChunk = THREE.ShaderChunk.lights_fragment_begin.replaceAll(
        'RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );',
        `
          RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
          RE_Direct_Scattering(directLight, vUv, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, reflectedLight);
        `
      );
      shader.fragmentShader = shader.fragmentShader.replace('#include <lights_fragment_begin>', lightsChunk);
    };
  }
}

// --- Pre-allocated helper vectors for GC-free calculations ---
const _posA = new THREE.Vector3();
const _posB = new THREE.Vector3();
const _velA = new THREE.Vector3();
const _velB = new THREE.Vector3();
const _diff = new THREE.Vector3();
const _normal = new THREE.Vector3();
const _correction = new THREE.Vector3();
const _relVel = new THREE.Vector3();
const _impulse = new THREE.Vector3();
const _followerPos = new THREE.Vector3();

// --- Physics Engine ---
class PhysicsWorld {
  center = new THREE.Vector3();

  constructor(config) {
    this.config = config;
    const count = config.count || 200;
    this.positionData = new Float32Array(3 * count).fill(0);
    this.velocityData = new Float32Array(3 * count).fill(0);
    this.sizeData = new Float32Array(count).fill(1);
    this.initialize();
  }

  initialize() {
    const count = this.config.count || 200;
    const maxX = this.config.maxX || 5;
    const maxY = this.config.maxY || 5;
    const maxZ = this.config.maxZ || 2;
    const minSize = this.config.minSize || 0.5;
    const maxSize = this.config.maxSize || 1;

    for (let i = 0; i < count; i++) {
      const idx = 3 * i;
      this.positionData[idx] = THREE.MathUtils.randFloatSpread(2 * maxX);
      this.positionData[idx + 1] = THREE.MathUtils.randFloatSpread(2 * maxY);
      this.positionData[idx + 2] = THREE.MathUtils.randFloatSpread(2 * maxZ);
      this.sizeData[i] = THREE.MathUtils.randFloat(minSize, maxSize);
    }
  }

  step(dt) {
    const count = this.config.count || 200;
    const gravity = this.config.gravity ?? 0.5;
    const friction = this.config.friction ?? 0.9975;
    const wallBounce = this.config.wallBounce ?? 0.95;
    const maxVelocity = this.config.maxVelocity ?? 0.15;
    const maxX = this.config.maxX || 5;
    const maxY = this.config.maxY || 5;
    const maxZ = this.config.maxZ || 2;
    const followCursor = this.config.followCursor ?? true;

    // Scale friction with dt (assuming original config friction was tuned for 60fps)
    const frictionFactor = Math.pow(friction, dt * 60);

    // First sphere (index 0) is the "follower" if enabled
    if (followCursor) {
      _posA.fromArray(this.positionData, 0);
      const lerpFactor = Math.min(0.1 * dt * 60, 1.0);
      _posA.lerp(this.center, lerpFactor).toArray(this.positionData, 0);
      this.velocityData[0] = 0;
      this.velocityData[1] = 0;
      this.velocityData[2] = 0;
    }

    for (let i = (followCursor ? 1 : 0); i < count; i++) {
      const base = 3 * i;
      _posA.fromArray(this.positionData, base);
      _velA.fromArray(this.velocityData, base);
      const radius = this.sizeData[i];

      // Gravity & Velocity update
      _velA.y -= dt * gravity * radius;
      _velA.multiplyScalar(frictionFactor);
      _velA.clampLength(0, maxVelocity);

      // Position update (frame-rate independent integration)
      _posA.addScaledVector(_velA, dt * 60);

      // Collisions with other spheres
      for (let j = i + 1; j < count; j++) {
        const otherBase = 3 * j;
        _posB.fromArray(this.positionData, otherBase);
        _diff.copy(_posB).sub(_posA);
        const dist = _diff.length();
        const sumRadius = radius + this.sizeData[j];

        if (dist < sumRadius) {
          const overlap = sumRadius - dist;
          _normal.copy(_diff).normalize();
          
          // Correction to prevent overlap (split equally)
          _correction.copy(_normal).multiplyScalar(0.5 * overlap);
          _posA.sub(_correction);
          _posB.add(_correction);
          _posB.toArray(this.positionData, otherBase);

          // Symmetric Elastic Impulse Transfer
          _velB.fromArray(this.velocityData, otherBase);
          _relVel.copy(_velB).sub(_velA);
          const velAlongNormal = _relVel.dot(_normal);
          
          // Only resolve if spheres are moving towards each other
          if (velAlongNormal < 0) {
            const restitution = 0.85; // slightly inelastic for more settled packing behavior
            const impulseScalar = -(1 + restitution) * velAlongNormal / 2;
            _impulse.copy(_normal).multiplyScalar(impulseScalar);
            
            _velA.sub(_impulse);
            _velB.add(_impulse);
            _velB.toArray(this.velocityData, otherBase);
          }
        }
      }

      // Special interaction with follower sphere (cursor repulsion)
      if (followCursor) {
        _followerPos.fromArray(this.positionData, 0);
        _diff.copy(_followerPos).sub(_posA);
        const d = _diff.length();
        const sumRadius = radius + this.sizeData[0];
        if (d < sumRadius) {
          const overlap = sumRadius - d;
          _normal.copy(_diff).normalize();
          _correction.copy(_normal).multiplyScalar(overlap);
          _posA.sub(_correction);
          _velA.addScaledVector(_normal, -0.2 * dt * 60);
        }
      }

      // Boundary Collisions
      if (Math.abs(_posA.x) + radius > maxX) {
        _posA.x = Math.sign(_posA.x) * (maxX - radius);
        _velA.x *= -wallBounce;
      }
      if (_posA.y - radius < -maxY) {
        _posA.y = -maxY + radius;
        _velA.y *= -wallBounce;
      } else if (gravity === 0 && _posA.y + radius > maxY) {
        _posA.y = maxY - radius;
        _velA.y *= -wallBounce;
      }
      if (Math.abs(_posA.z) + radius > maxZ) {
        _posA.z = Math.sign(_posA.z) * (maxZ - radius);
        _velA.z *= -wallBounce;
      }

      _posA.toArray(this.positionData, base);
      _velA.toArray(this.velocityData, base);
    }
  }

  update(delta) {
    // Clamp delta to avoid massive leaps during lag spikes
    const clampedDelta = Math.min(delta, 0.1);

    // Split delta into 4 physics sub-steps to ensure high fidelity, smooth collisions,
    // and complete stability against velocity spikes.
    const substeps = 4;
    const stepDelta = clampedDelta / substeps;

    for (let step = 0; step < substeps; step++) {
      this.step(stepDelta);
    }
  }
}

// --- Main Component ---
export const BallpitBackground = ({
  count = 200,
  colors = ['#ffffff', '#888888', '#444444'],
  ambientColor = '#ffffff',
  ambientIntensity = 1,
  lightIntensity = 200,
  minSize = 0.5,
  maxSize = 1,
  gravity = 0.5,
  friction = 0.9975,
  wallBounce = 0.95,
  maxVelocity = 0.15,
  followCursor = true,
  className = ""
}) => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const parent = containerRef.current;
    
    // Setup Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Scene & Environment
    const scene = new THREE.Scene();
    const roomEnv = new RoomEnvironment();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTexture = pmrem.fromScene(roomEnv).texture;

    // Camera
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 1000);
    camera.position.z = 20;

    // Geometry & Material
    const geometry = new THREE.SphereGeometry(1, 32, 32);
    const material = new PhysicalScatteringMaterial({
      envMap: envTexture,
      metalness: 0.5,
      roughness: 0.5,
      clearcoat: 1,
      clearcoatRoughness: 0.15
    });

    // Instanced Mesh
    const imesh = new THREE.InstancedMesh(geometry, material, count);
    scene.add(imesh);

    // Lights
    const ambient = new THREE.AmbientLight(ambientColor, ambientIntensity);
    scene.add(ambient);

    const pointLight = new THREE.PointLight(colors[0], lightIntensity);
    scene.add(pointLight);

    // Physics
    const config = {
      count, minSize, maxSize, gravity, friction, wallBounce, 
      maxVelocity, followCursor, maxX: 5, maxY: 5, maxZ: 2
    };
    const physics = new PhysicsWorld(config);

    // Set Instance Colors
    const threeColors = colors.map(c => new THREE.Color(c));
    for (let i = 0; i < count; i++) {
      const color = threeColors[i % threeColors.length];
      imesh.setColorAt(i, color);
    }
    imesh.instanceColor.needsUpdate = true;

    // Raycasting for Interaction
    const raycaster = new THREE.Raycaster();
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const intersection = new THREE.Vector3();
    const pointer = new THREE.Vector2();

    const updatePointer = (e) => {
      const x = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const y = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((x - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((y - rect.top) / rect.height) * 2 + 1;
      
      raycaster.setFromCamera(pointer, camera);
      raycaster.ray.intersectPlane(plane, intersection);
      physics.center.copy(intersection);
    };

    window.addEventListener('mousemove', updatePointer);
    window.addEventListener('touchstart', updatePointer);
    window.addEventListener('touchmove', updatePointer);

    // Resize Logic
    let resizeAnimationFrameId;
    const resize = () => {
      cancelAnimationFrame(resizeAnimationFrameId);
      resizeAnimationFrameId = requestAnimationFrame(() => {
        if (!parent || !renderer || !camera || !physics) return;
        const w = parent.offsetWidth;
        const h = parent.offsetHeight;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();

        // Update World Boundaries
        const fovRad = (camera.fov * Math.PI) / 180;
        const wHeight = 2 * Math.tan(fovRad / 2) * camera.position.z;
        const wWidth = wHeight * camera.aspect;
        physics.config.maxX = wWidth / 2;
        physics.config.maxY = wHeight / 2;
      });
    };
    
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(parent);
    resize();

    // Prevent ResizeObserver loop error from showing up in console or breaking dev environment
    const handleError = (e) => {
      if (
        e.message &&
        (e.message.includes('ResizeObserver loop completed with undelivered notifications') ||
         e.message.includes('ResizeObserver loop limit exceeded'))
      ) {
        e.stopImmediatePropagation();
        e.preventDefault();
      }
    };
    window.addEventListener('error', handleError);

    // Animation Loop
    let animationFrameId;
    const clock = new THREE.Clock();
    const dummy = new THREE.Object3D();

    const animate = () => {
      const delta = clock.getDelta();
      physics.update(Math.min(delta, 0.1));

      for (let i = 0; i < count; i++) {
        dummy.position.fromArray(physics.positionData, i * 3);
        const s = physics.sizeData[i];
        
        // Hide follower if not needed
        if (i === 0 && !followCursor) {
          dummy.scale.setScalar(0);
        } else {
          dummy.scale.setScalar(s);
        }
        
        dummy.updateMatrix();
        imesh.setMatrixAt(i, dummy.matrix);
        
        if (i === 0) pointLight.position.copy(dummy.position);
      }
      imesh.instanceMatrix.needsUpdate = true;

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('mousemove', updatePointer);
      window.removeEventListener('touchstart', updatePointer);
      window.removeEventListener('touchmove', updatePointer);
      window.removeEventListener('error', handleError);
      resizeObserver.disconnect();
      cancelAnimationFrame(resizeAnimationFrameId);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      pmrem.dispose();
      roomEnv.dispose();
    };
  }, [count, colors, ambientColor, ambientIntensity, lightIntensity, minSize, maxSize, gravity, friction, wallBounce, maxVelocity, followCursor]);

  return (
    <div ref={containerRef} className={`relative w-full h-full overflow-hidden ${className}`}>
      <canvas ref={canvasRef} className="block w-full h-full outline-none" />
    </div>
  );
};

export default BallpitBackground;
