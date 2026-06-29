    // 1. Drag-to-Scroll & Parallax/Fade Engine
    const slider = document.getElementById('dragContainer');
    const panels = document.querySelectorAll('.intro-panel');
    let isDown = false;
    let startX, scrollLeft;

    slider.addEventListener('mousedown', (e) => {
        isDown = true;
        startX = e.pageX - slider.offsetLeft;
        scrollLeft = slider.scrollLeft;
    });

    slider.addEventListener('mouseleave', () => isDown = false);
    slider.addEventListener('mouseup', () => isDown = false);

    slider.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - slider.offsetLeft;
        const walk = (x - startX) * 2;
        slider.scrollLeft = scrollLeft - walk;
    });

    slider.addEventListener('scroll', () => {
        const scrollPos = slider.scrollLeft;
        
        panels.forEach((panel) => {
            const rect = panel.getBoundingClientRect();
            const center = window.innerWidth / 2;
            const panelCenter = rect.left + rect.width / 2;
            
            // Interactive Text: Move slightly on scroll
            const move = (center - panelCenter) * 0.1;
            panel.style.transform = `translateX(${move}px)`;
            
            // Interactive Text: Fade out at edges
            const distFromCenter = Math.abs(center - panelCenter);
            panel.style.opacity = Math.max(0.2, 1 - distFromCenter / 500);
        });

        // Sync 3D background rotation with scroll
        particles.rotation.y = scrollPos * 0.001;
    });

    // 2. 3D Background Engine
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas: document.querySelector('#bgCanvas'), antialias: true });

    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.position.z = 30;

    const geometry = new THREE.BufferGeometry();
    const count = 5000;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) positions[i] = (Math.random() - 0.5) * 100;
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({ size: 0.05, color: 0xffffff });
    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    function animate() {
        requestAnimationFrame(animate);
        particles.rotation.y += 0.0005;
        renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    });
