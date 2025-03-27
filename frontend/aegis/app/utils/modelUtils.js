import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';

// Note: For STEP files, you'll need to use a specialized library or service
// Since STEP file loading isn't natively supported in Three.js

export const ModelUtils = {
  /**
   * Load a model file based on its extension
   * @param {ArrayBuffer} buffer - The raw file data
   * @param {string} fileExtension - The file extension (step, stl, etc.)
   * @returns {Promise<THREE.Object3D>} - A Three.js object
   */
  loadModel: async (buffer, fileExtension) => {
    // Normalize extension
    const ext = fileExtension.toLowerCase();
    
    if (ext === 'stl') {
      return ModelUtils.loadSTL(buffer);
    } else if (ext === 'step' || ext === 'stp') {
      // For now, we'll need to convert STEP to STL on the backend
      // or use a specialized library for client-side conversion
      throw new Error('STEP files need server-side conversion to STL for display');
    } else {
      throw new Error(`Unsupported file format: ${ext}`);
    }
  },
  
  /**
   * Load an STL file
   * @param {ArrayBuffer} buffer - The raw STL data
   * @returns {Promise<THREE.Object3D>} - A Three.js object
   */
  loadSTL: (buffer) => {
    return new Promise((resolve, reject) => {
      try {
        const loader = new STLLoader();
        const geometry = loader.parse(buffer);
        
        // Create a mesh with standard material
        const material = new THREE.MeshStandardMaterial({
          color: 0x3080ff,
          metalness: 0.2,
          roughness: 0.5,
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        
        // Center the model
        geometry.computeBoundingBox();
        const boundingBox = geometry.boundingBox;
        const center = new THREE.Vector3();
        boundingBox.getCenter(center);
        mesh.position.sub(center);
        
        // Set name for later reference
        mesh.name = 'model';
        
        // Calculate appropriate camera position based on model size
        const size = new THREE.Vector3();
        boundingBox.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);
        const cameraDistance = maxDim * 2;
        
        resolve({
          model: mesh,
          boundingBox,
          center,
          cameraDistance
        });
      } catch (error) {
        reject(new Error(`STL parsing error: ${error.message}`));
      }
    });
  },
  
  /**
   * Create a wireframe version of a model
   * @param {THREE.Object3D} model - The model to create a wireframe for
   * @returns {THREE.Object3D} - Wireframe version of the model
   */
  createWireframe: (model) => {
    if (!model || !model.geometry) {
      return null;
    }
    
    const wireframeGeometry = new THREE.WireframeGeometry(model.geometry);
    const wireframe = new THREE.LineSegments(wireframeGeometry);
    wireframe.material.color.set(0x000000);
    wireframe.material.opacity = 0.25;
    wireframe.material.transparent = true;
    
    return wireframe;
  },
  
  /**
   * Extract measurements from a model
   * @param {THREE.Object3D} model - The model to measure
   * @returns {Object} - Dimensions and other measurements
   */
  getMeasurements: (model) => {
    if (!model || !model.geometry || !model.geometry.boundingBox) {
      model.geometry.computeBoundingBox();
    }
    
    const boundingBox = model.geometry.boundingBox;
    const size = new THREE.Vector3();
    boundingBox.getSize(size);
    
    return {
      width: size.x.toFixed(2),
      height: size.y.toFixed(2),
      depth: size.z.toFixed(2),
      volume: (size.x * size.y * size.z).toFixed(2)
    };
  }
};

export default ModelUtils;