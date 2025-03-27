"use client";

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { 
  Box, 
  Layers, 
  Grid3x3, 
  Package, 
  Download,
  Maximize,
  Move3d,
  Ruler,
  Eye,
  ChevronsRight,
  Camera,
  PanelTopClose,
  RotateCcw,
  Save
} from 'lucide-react';

import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import designApi from '@/app/utils/api';
import ModelUtils from '@/app/utils/modelUtils';

const ModelViewer = ({ modelUrl, isLoading }) => {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const animationFrameRef = useRef(null);
  const measurementToolsRef = useRef(null);
  
  const [viewMode, setViewMode] = useState('solid'); // 'solid', 'wireframe', 'both'
  const [gridVisible, setGridVisible] = useState(true);
  const [axesVisible, setAxesVisible] = useState(true);
  const [measureMode, setMeasureMode] = useState(false);
  const [measurementResults, setMeasurementResults] = useState(null);
  const [modelInfo, setModelInfo] = useState(null);
  const [toolsExpanded, setToolsExpanded] = useState(true);

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f5f5);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      60,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(5, 5, 5);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      preserveDrawingBuffer: true // Required for screenshots
    });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls setup
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.minDistance = 1;
    controls.maxDistance = 100;
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7.5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Grid helper
    const gridHelper = new THREE.GridHelper(20, 20);
    gridHelper.name = 'grid';
    scene.add(gridHelper);

    // Axes helper
    const axesHelper = new THREE.AxesHelper(5);
    axesHelper.name = 'axes';
    scene.add(axesHelper);

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

    // Setup measurement tools
    const measurementTools = {
      raycaster: new THREE.Raycaster(),
      pointer: new THREE.Vector2(),
      spheres: [],
      line: null,
      selectedPoints: [],

      reset: function() {
        // Remove existing measurement markers
        this.spheres.forEach(sphere => {
          scene.remove(sphere);
        });
        this.spheres = [];
        
        if (this.line) {
          scene.remove(this.line);
          this.line = null;
        }
        
        this.selectedPoints = [];
        setMeasurementResults(null);
      },

      createMarker: function(position) {
        const geometry = new THREE.SphereGeometry(0.1, 16, 16);
        const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.copy(position);
        scene.add(sphere);
        this.spheres.push(sphere);
        return sphere;
      },

      createLine: function(start, end) {
        if (this.line) {
          scene.remove(this.line);
        }
        
        const material = new THREE.LineBasicMaterial({ color: 0xff0000 });
        const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
        const line = new THREE.Line(geometry, material);
        scene.add(line);
        this.line = line;
      },

      handleClick: function(event) {
        if (!measureMode || !sceneRef.current) return;
        
        // Calculate normalized device coordinates
        const rect = rendererRef.current.domElement.getBoundingClientRect();
        this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        // Find intersections
        this.raycaster.setFromCamera(this.pointer, cameraRef.current);
        const model = sceneRef.current.getObjectByName('model');
        
        if (!model) return;
        
        const intersects = this.raycaster.intersectObject(model, true);
        
        if (intersects.length > 0) {
          const intersectionPoint = intersects[0].point;
          this.createMarker(intersectionPoint);
          this.selectedPoints.push(intersectionPoint);
          
          // If we have two points, create a line and calculate distance
          if (this.selectedPoints.length === 2) {
            this.createLine(this.selectedPoints[0], this.selectedPoints[1]);
            const distance = this.selectedPoints[0].distanceTo(this.selectedPoints[1]);
            setMeasurementResults({
              distance: distance.toFixed(2),
              units: 'mm', // Assuming model units are mm
            });
          }
          
          // Reset after two points
          if (this.selectedPoints.length >= 2) {
            setTimeout(() => {
              this.reset();
            }, 3000);
          }
        }
      }
    };

    measurementToolsRef.current = measurementTools;
    
    // Add click event listener for measurements
    const handleMeasureClick = (event) => {
      measurementToolsRef.current.handleClick(event);
    };
    
    renderer.domElement.addEventListener('click', handleMeasureClick);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      
      // Safely remove event listener 
      const currentRenderer = rendererRef.current;
      const currentContainer = containerRef.current;
      
      if (currentRenderer && currentRenderer.domElement) {
        currentRenderer.domElement.removeEventListener('click', handleMeasureClick);
      }
      
      cancelAnimationFrame(animationFrameRef.current);
      
      if (currentRenderer && currentContainer) {
        currentContainer.removeChild(currentRenderer.domElement);
      }
      
      if (sceneRef.current) {
        sceneRef.current.clear();
      }
      
      if (controlsRef.current) {
        controlsRef.current.dispose();
      }
      
      if (currentRenderer) {
        currentRenderer.dispose();
      }
    };
  }, [measureMode]);

  // Load model when URL changes
  useEffect(() => {
    if (!modelUrl || !sceneRef.current || !cameraRef.current) return;
  
    // Track if component is still mounted during async operation
    let isMounted = true;
    
    // Remove any existing model
    const existingModel = sceneRef.current.getObjectByName('model');
    if (existingModel) {
      sceneRef.current.remove(existingModel);
    }
  
    // Remove wireframe overlay if it exists
    const wireframeOverlay = sceneRef.current.getObjectByName('wireframe-overlay');
    if (wireframeOverlay) {
      sceneRef.current.remove(wireframeOverlay);
    }
  
    // Reset measurement tools
    if (measurementToolsRef.current) {
      measurementToolsRef.current.reset();
    }
  
    // Clear model info
    setModelInfo(null);
  
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
      
      // Set some placeholder model info
      setModelInfo({
        dimensions: { width: 2, height: 2, depth: 2 },
        volume: 8,
        surfaceArea: 24,
        units: 'mm'
      });
      
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
        
        // Check if component is still mounted
        if (!isMounted) return;
        
        // Load the model using our utility
        const { model, boundingBox, center, cameraDistance } = await ModelUtils.loadSTL(modelData);
        
        // Check if component is still mounted
        if (!isMounted) return;
        
        // Add the model to the scene
        sceneRef.current.add(model);
        
        // Update camera position based on model size
        if (cameraDistance && cameraRef.current) {
          cameraRef.current.position.set(
            cameraDistance * 0.7, 
            cameraDistance * 0.7, 
            cameraDistance * 0.7
          );
          controlsRef.current?.target.copy(center);
          controlsRef.current?.update();
        }
  
        // Calculate model info
        const size = new THREE.Vector3();
        boundingBox.getSize(size);
        
        // Set model info
        setModelInfo({
          dimensions: { 
            width: size.x.toFixed(2), 
            height: size.y.toFixed(2), 
            depth: size.z.toFixed(2) 
          },
          volume: (size.x * size.y * size.z).toFixed(2),
          boundingBox: boundingBox,
          center: center,
          units: 'mm'
        });
        
        // Apply current view mode
        if (viewMode === 'wireframe') {
          model.material.wireframe = true;
        } else if (viewMode === 'both') {
          const wireframe = ModelUtils.createWireframe(model);
          if (wireframe) {
            wireframe.name = 'wireframe-overlay';
            sceneRef.current.add(wireframe);
          }
        }
        
      } catch (error) {
        console.error('Error loading model:', error);
        
        // Check if component is still mounted
        if (!isMounted) return;
        
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
        
        // Set some basic model info
        setModelInfo({
          dimensions: { width: 2, height: 2, depth: 2 },
          volume: 8,
          surfaceArea: 24,
          units: 'mm'
        });
      }
    };
    
    loadModel();
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [modelUrl, viewMode]);
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
        // Create wireframe overlay if it doesn't exist
        if (!sceneRef.current.getObjectByName('wireframe-overlay')) {
          const wireframe = ModelUtils.createWireframe(model);
          if (wireframe) {
            wireframe.name = 'wireframe-overlay';
            sceneRef.current.add(wireframe);
          }
        }
        model.material.wireframe = false;
        break;
      default:
        model.material.wireframe = false;
    }
    
    // Remove wireframe overlay if not in 'both' mode
    if (viewMode !== 'both') {
      const wireframeOverlay = sceneRef.current.getObjectByName('wireframe-overlay');
      if (wireframeOverlay) {
        sceneRef.current.remove(wireframeOverlay);
      }
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

  // Toggle axes visibility
  useEffect(() => {
    if (!sceneRef.current) return;
    
    const axes = sceneRef.current.getObjectByName('axes');
    if (axes) {
      axes.visible = axesVisible;
    }
    
  }, [axesVisible]);

  // Set view preset
  const setViewPreset = (preset) => {
    if (!cameraRef.current || !controlsRef.current) return;
    
    const distance = modelInfo?.boundingBox 
      ? Math.max(
          modelInfo.dimensions.width, 
          modelInfo.dimensions.height, 
          modelInfo.dimensions.depth
        ) * 2
      : 5;
    
    switch (preset) {
      case 'front':
        cameraRef.current.position.set(0, 0, distance);
        break;
      case 'back':
        cameraRef.current.position.set(0, 0, -distance);
        break;
      case 'left':
        cameraRef.current.position.set(-distance, 0, 0);
        break;
      case 'right':
        cameraRef.current.position.set(distance, 0, 0);
        break;
      case 'top':
        cameraRef.current.position.set(0, distance, 0);
        break;
      case 'bottom':
        cameraRef.current.position.set(0, -distance, 0);
        break;
      case 'isometric':
        cameraRef.current.position.set(
          distance * 0.7, 
          distance * 0.7, 
          distance * 0.7
        );
        break;
      default:
        return;
    }
    
    if (modelInfo?.center) {
      controlsRef.current.target.copy(modelInfo.center);
    } else {
      controlsRef.current.target.set(0, 0, 0);
    }
    
    controlsRef.current.update();
  };

  // Take a screenshot
  const takeScreenshot = () => {
    if (!rendererRef.current) return;
    
    const link = document.createElement('a');
    link.download = 'cad-model-screenshot.png';
    link.href = rendererRef.current.domElement.toDataURL('image/png');
    link.click();
  };

  // Export model (for now, this just downloads the current model)
  const exportModel = (format) => {
    if (!modelUrl) return;
    
    // If we have a STEP file URL, use that for download
    const downloadUrl = format === 'step' && modelUrl.endsWith('.stl')
      ? modelUrl.replace(/\.stl$/i, '.step')
      : modelUrl;
    
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `model.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Reset camera
  const resetCamera = () => {
    if (!controlsRef.current || !cameraRef.current || !modelInfo) return;
    
    const distance = Math.max(
      modelInfo.dimensions.width, 
      modelInfo.dimensions.height, 
      modelInfo.dimensions.depth
    ) * 2;
    
    cameraRef.current.position.set(
      distance * 0.7, 
      distance * 0.7, 
      distance * 0.7
    );
    
    if (modelInfo.center) {
      controlsRef.current.target.copy(modelInfo.center);
    } else {
      controlsRef.current.target.set(0, 0, 0);
    }
    
    controlsRef.current.update();
  };

  return (
    <div className="relative h-full w-full">
      {/* Viewer container */}
      <div 
        ref={containerRef} 
        className="absolute inset-0"
      />
      
      {/* Measurement results */}
      {measureMode && measurementResults && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white py-2 px-4 rounded-md shadow-md">
          <p className="text-sm font-medium">Distance: {measurementResults.distance} {measurementResults.units}</p>
        </div>
      )}
      
      {/* Model info panel */}
      {modelInfo && (
        <div className="absolute top-4 left-4 bg-white p-3 rounded-md shadow-md max-w-xs">
          <h3 className="text-sm font-semibold mb-1">Model Dimensions</h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <div>Width:</div>
            <div>{modelInfo.dimensions.width} {modelInfo.units}</div>
            <div>Height:</div>
            <div>{modelInfo.dimensions.height} {modelInfo.units}</div>
            <div>Depth:</div>
            <div>{modelInfo.dimensions.depth} {modelInfo.units}</div>
            <div>Volume:</div>
            <div>{modelInfo.volume} {modelInfo.units}³</div>
          </div>
        </div>
      )}
      
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50 bg-opacity-70 z-10">
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
      
      {/* Tools sidebar - can be collapsed */}
      <div className={`absolute top-4 right-4 transition-all duration-200 ${toolsExpanded ? 'translate-x-0' : 'translate-x-[calc(100%-2.5rem)]'}`}>
        <div className="bg-white rounded-md shadow-md flex">
          {/* Collapse/expand button */}
          <button 
            className="p-2 h-full flex items-center justify-center border-r"
            onClick={() => setToolsExpanded(!toolsExpanded)}
          >
            <ChevronsRight className={`h-5 w-5 transition-transform duration-200 ${toolsExpanded ? 'rotate-180' : ''}`} />
          </button>
          
          {/* Tools */}
          <div className="p-1.5">
            <div className="grid grid-cols-3 gap-1">
              {/* View mode buttons */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className={`h-8 w-8 ${viewMode === 'solid' ? 'bg-slate-200' : ''}`}
                      onClick={() => setViewMode('solid')}
                    >
                      <Box size={18} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Solid view</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className={`h-8 w-8 ${viewMode === 'wireframe' ? 'bg-slate-200' : ''}`}
                      onClick={() => setViewMode('wireframe')}
                    >
                      <Layers size={18} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Wireframe view</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className={`h-8 w-8 ${viewMode === 'both' ? 'bg-slate-200' : ''}`}
                      onClick={() => setViewMode('both')}
                    >
                      <div className="relative">
                        <Box size={18} className="opacity-80" />
                        <Layers size={14} className="absolute top-0 left-0 opacity-40" />
                      </div>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Solid with wireframe</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              {/* Toggle buttons */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className={`h-8 w-8 ${gridVisible ? 'bg-slate-200' : ''}`}
                      onClick={() => setGridVisible(!gridVisible)}
                    >
                      <Grid3x3 size={18} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Toggle grid</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className={`h-8 w-8 ${axesVisible ? 'bg-slate-200' : ''}`}
                      onClick={() => setAxesVisible(!axesVisible)}
                    >
                      <Move3d size={18} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Toggle axes</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className={`h-8 w-8 ${measureMode ? 'bg-slate-200' : ''}`}
                      onClick={() => {
                        if (measureMode && measurementToolsRef.current) {
                          measurementToolsRef.current.reset();
                        }
                        setMeasureMode(!measureMode);
                      }}
                    >
                      <Ruler size={18} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Measurement tool</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            <Separator className="my-1.5" />
            
            {/* View presets */}
            <div className="grid grid-cols-3 gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-8 w-8"
                  >
                    <Eye size={18} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>View Presets</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setViewPreset('front')}>Front</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setViewPreset('back')}>Back</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setViewPreset('left')}>Left</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setViewPreset('right')}>Right</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setViewPreset('top')}>Top</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setViewPreset('bottom')}>Bottom</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setViewPreset('isometric')}>Isometric</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8"
                      onClick={resetCamera}
                    >
                      <RotateCcw size={18} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Reset camera</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8"
                      onClick={takeScreenshot}
                    >
                      <Camera size={18} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Take screenshot</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              {/* Export options */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-8 w-8"
                    disabled={!modelUrl}
                  >
                    <Download size={18} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Export Model</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => exportModel('step')}>STEP Format</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportModel('stl')}>STL Format</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Fill remaining cells with empty divs for grid alignment */}
              <div></div>
              <div></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Measurement instructions */}
      {measureMode && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white py-2 px-4 rounded-md shadow-md">
          <p className="text-xs text-center">Click two points on the model to measure the distance</p>
        </div>
      )}
    </div>
  );
};

export default ModelViewer;