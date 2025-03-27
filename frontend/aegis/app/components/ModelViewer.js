"use client";

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { Box, Layers, Grid3x3, Package } from 'lucide-react';
import designApi from '@/app/utils/api';
import ModelUtils from '@/app/utils/modelUtils';

const ModelViewer = ({ modelUrl, isLoading }) => {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const [viewMode, setViewMode] = useState('solid'); // 'solid', 'wireframe', 'both'
  const [gridVisible, setGridVisible] = useState(true);
  const animationFrameRef = useRef(null);

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f5f5);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 5;
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls setup
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // Grid helper
    const gridHelper = new THREE.GridHelper(10, 10);
    gridHelper.name = 'grid';
    scene.add(gridHelper);

    // Animation loop
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      if (!containerRef.current) return;
      
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameRef.current);
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      scene.clear();
      controls.dispose();
      renderer.dispose();
    };
  }, []);

  // In ModelViewer.js, modify the useEffect for loading the model
// Load model when URL changes
useEffect(() => {
    if (!modelUrl || !sceneRef.current || !cameraRef.current) return;
  
    // Remove any existing model
    const existingModel = sceneRef.current.getObjectByName('model');
    if (existingModel) {
      sceneRef.current.remove(existingModel);
    }
  
    // For development/testing without a backend
    if (modelUrl === 'placeholder') {
      // Placeholder cube for testing
      const geometry = new THREE.BoxGeometry(2, 2, 2);
      const material = new THREE.MeshStandardMaterial({ 
        color: 0x3080ff,
        metalness: 0.2,
        roughness: 0.5,
      });
      const cube = new THREE.Mesh(geometry, material);
      cube.name = 'model';
      sceneRef.current.add(cube);
      return;
    }
  
    // Real implementation with the ModelUtils
    const loadModel = async () => {
      try {
        // Convert STEP URL to STL URL for viewing
        // If we already have an STL URL from the backend, use that instead
        let viewUrl = modelUrl;
        if (modelUrl.endsWith('.step') || modelUrl.endsWith('.stp')) {
          viewUrl = modelUrl.replace(/\.step$|\.stp$/i, '.stl');
        }
        
        console.log("Fetching model for viewing from:", viewUrl);
        
        // Get model file data
        const modelData = await designApi.getModelFile(viewUrl);
        
        // Load the model using our utility
        const { model, cameraDistance } = await ModelUtils.loadSTL(modelData);
        
        // Add the model to the scene
        sceneRef.current.add(model);
        
        // Update camera position based on model size
        if (cameraDistance && cameraRef.current) {
          cameraRef.current.position.z = cameraDistance;
          controlsRef.current?.update();
        }
      } catch (error) {
        console.error('Error loading model:', error);
        
        // Fallback to a simple cube if loading fails
        const geometry = new THREE.BoxGeometry(2, 2, 2);
        const material = new THREE.MeshStandardMaterial({ 
          color: 0x3080ff,
          metalness: 0.2,
          roughness: 0.5,
        });
        const cube = new THREE.Mesh(geometry, material);
        cube.name = 'model';
        sceneRef.current.add(cube);
      }
    };
    
    loadModel();
  }, [modelUrl]);
  
  // Update view mode
  useEffect(() => {
    if (!sceneRef.current) return;
    
    const model = sceneRef.current.getObjectByName('model');
    if (!model) return;
    
    switch (viewMode) {
      case 'wireframe':
        model.material.wireframe = true;
        break;
      case 'solid':
        model.material.wireframe = false;
        break;
      case 'both':
        // In a real implementation, you would create two materials
        // One solid and one wireframe
        model.material.wireframe = false;
        break;
      default:
        model.material.wireframe = false;
    }
    
  }, [viewMode]);

  // Toggle grid visibility
  useEffect(() => {
    if (!sceneRef.current) return;
    
    const grid = sceneRef.current.getObjectByName('grid');
    if (grid) {
      grid.visible = gridVisible;
    }
    
  }, [gridVisible]);

  return (
    <div className="relative h-full w-full">
      {/* Viewer container */}
      <div 
        ref={containerRef} 
        className="absolute inset-0"
      />
      
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50 bg-opacity-70">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-700">Generating your design...</p>
          </div>
        </div>
      )}
      
      {/* Empty state */}
      {!modelUrl && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-slate-400">
            <Package size={48} className="mx-auto mb-4" />
            <p className="text-lg font-medium">No model loaded</p>
            <p className="text-sm">Use the chat to describe a design</p>
          </div>
        </div>
      )}
      
      {/* Controls */}
      <div className="absolute bottom-4 right-4 bg-white rounded-md shadow-md">
        <div className="flex">
          <button 
            className={`p-2 hover:bg-slate-100 ${viewMode === 'solid' ? 'text-blue-500' : 'text-slate-600'}`}
            onClick={() => setViewMode('solid')}
            title="Solid view"
          >
            <Box size={20} />
          </button>
          <button 
            className={`p-2 hover:bg-slate-100 ${viewMode === 'wireframe' ? 'text-blue-500' : 'text-slate-600'}`}
            onClick={() => setViewMode('wireframe')}
            title="Wireframe view"
          >
            <Layers size={20} />
          </button>
          <button 
            className={`p-2 hover:bg-slate-100 ${gridVisible ? 'text-blue-500' : 'text-slate-600'}`}
            onClick={() => setGridVisible(!gridVisible)}
            title="Toggle grid"
          >
            <Grid3x3 size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModelViewer;