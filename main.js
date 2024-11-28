import LocomotiveScroll from "locomotive-scroll";

import * as THREE from "three";
import gsap from "gsap";

import vertexShader from "./shaders/vertexShader.glsl";
import fragmentShader from "./shaders/fragmentShader.glsl";

// Check if device is mobile or window width is less than desktop size (1024px)
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const isDesktop = window.innerWidth >= 1024;

if (!isMobile && isDesktop) {
  const locomotiveScroll = new LocomotiveScroll();
  // Create scene, camera and renderer
  const distance = 600;
  const scene = new THREE.Scene();
  const fov = 2 * Math.atan((window.innerHeight / 2) / distance) * (180 / Math.PI);
  const camera = new THREE.PerspectiveCamera(
    fov,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector("#canvas"),
    // antialias: true,
    alpha: true,
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  camera.position.z = distance;

  // Setup raycaster
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  const images = document.querySelectorAll('img');
  const planes = [];
  images.forEach(image => {
    const imgbounds = image.getBoundingClientRect();
    const texture = new THREE.TextureLoader().load(image.src);
    texture.needsUpdate = true;
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTexture: { value: texture },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uHover: { value: 0 }
      }
    });
    const geometry = new THREE.PlaneGeometry(imgbounds.width, imgbounds.height);
    const plane = new THREE.Mesh(geometry, material);
    plane.userData.image = image; // Store reference to original image
    plane.position.set(imgbounds.left - window.innerWidth / 2 + imgbounds.width / 2, -imgbounds.top + window.innerHeight / 2 - imgbounds.height / 2, 0);
    planes.push(plane);
    scene.add(plane);
  });

  // Handle mouse movement
  let mouseTimeout;
  window.addEventListener('mousemove', (event) => {
    // Get mouse position relative to window
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Update the picking ray with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);

    // Calculate intersections
    const intersects = raycaster.intersectObjects(planes);

    // Reset all plane uniforms
    planes.forEach(plane => {
      plane.material.uniforms.uMouse.value.set(0.5, 0.5);
    });

    // Update the first intersected plane
    if (intersects.length > 0) {
      const intersectedPlane = intersects[0];
      if (intersectedPlane.uv) {
        gsap.to(intersectedPlane.object.material.uniforms.uMouse.value, {
          x: intersectedPlane.uv.x,
          y: intersectedPlane.uv.y,
          duration: 0.03,
          ease: "power2.out"
        });
        gsap.to(intersectedPlane.object.material.uniforms.uHover, {
          value: 1,
          duration: 0.03,
          ease: "power2.out"
        });
      }
    }

    // Clear existing timeout and set a new one
    clearTimeout(mouseTimeout);
    mouseTimeout = setTimeout(() => {
      // Reset hover value for all planes when mouse stops moving
      planes.forEach(plane => {
        gsap.to(plane.material.uniforms.uHover, {
          value: 0,
          duration: 0.3,
          ease: "power2.out"
        });
      });
    }, 100); // Adjust timeout duration as needed
  });

  function updatePlanesPosition() {
    planes.forEach((plane) => {
      const image = plane.userData.image;
      const imgbounds = image.getBoundingClientRect();
      
      // Update geometry to match new image bounds
      plane.geometry.dispose();
      plane.geometry = new THREE.PlaneGeometry(imgbounds.width, imgbounds.height);
      
      // Update texture size
      const texture = plane.material.uniforms.uTexture.value;
      texture.repeat.set(1, 1);
      texture.offset.set(0, 0);
      texture.needsUpdate = true;
      
      // Update position
      plane.position.set(
        imgbounds.left - window.innerWidth / 2 + imgbounds.width / 2,
        -imgbounds.top + window.innerHeight / 2 - imgbounds.height / 2,
        0
      );
    });
  }

  // Animation loop
  function animate() {
    requestAnimationFrame(animate);
    updatePlanesPosition();

    // plane.rotation.x += 0.01;
    // plane.rotation.y += 0.01;

    renderer.render(scene, camera);
  }

  // Handle window resize
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    updatePlanesPosition();
  });

  animate();
} else {
  // Just initialize locomotive scroll for mobile or non-desktop sizes
  const locomotiveScroll = new LocomotiveScroll();
  document.getElementById('canvas').style.display = 'none';
  document.querySelectorAll('img').forEach(img => {
    img.style.opacity = 1;
  });
}