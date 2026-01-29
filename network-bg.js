// ===== Constellation Network Background =====
// Subtle, animated particle network for visual depth

const NetworkBackground = (function() {
    let canvas, ctx;
    let particles = [];
    let animationId;
    let isRunning = false;
    let scrollY = 0;
    let mouseX = null;
    let mouseY = null;

    // Configuration
    const config = {
        particleCount: 80,          // Number of nodes
        particleSize: 3,            // Base size of nodes
        particleOpacity: 0.6,       // Node opacity
        lineOpacity: 0.25,          // Connection line opacity
        lineDistance: 180,          // Max distance to draw connections
        speed: 0.5,                 // Movement speed
        parallaxFactor: 0.05,       // Scroll parallax intensity
        mouseRadius: 150,           // Mouse interaction radius (reduced)
        mouseRepel: 0.5,            // Mouse repel strength (gentler)
        colors: {
            particle: '99, 102, 241',    // Indigo (primary)
            line: '139, 92, 246',        // Purple (secondary)
            accent: '16, 185, 129'       // Emerald (accent)
        }
    };

    // Particle class
    class Particle {
        constructor() {
            this.reset();
            // Start at random position
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
        }

        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            // Store base velocity for restoration
            this.baseVx = (Math.random() - 0.5) * config.speed;
            this.baseVy = (Math.random() - 0.5) * config.speed;
            this.vx = this.baseVx;
            this.vy = this.baseVy;
            this.size = config.particleSize + Math.random() * 1.5;
            this.opacity = config.particleOpacity * (0.5 + Math.random() * 0.5);
            this.pulsePhase = Math.random() * Math.PI * 2;
            this.pulseSpeed = 0.02 + Math.random() * 0.02;

            // Green accent nodes represent business owners in the network
            this.isAccent = Math.random() < 0.3;
        }

        update() {
            // Add subtle pulse to size
            this.pulsePhase += this.pulseSpeed;
            const pulse = Math.sin(this.pulsePhase) * 0.3;
            this.currentSize = this.size + pulse;

            // Mouse interaction - gentle repel
            if (mouseX !== null && mouseY !== null) {
                const dx = this.x - mouseX;
                const dy = this.y - (mouseY + scrollY * config.parallaxFactor);
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < config.mouseRadius) {
                    const force = (config.mouseRadius - dist) / config.mouseRadius;
                    this.vx += (dx / dist) * force * config.mouseRepel * 0.1;
                    this.vy += (dy / dist) * force * config.mouseRepel * 0.1;
                }
            }

            // Apply velocity with damping
            this.x += this.vx;
            this.y += this.vy;
            this.vx *= 0.96;  // Stronger damping
            this.vy *= 0.96;

            // Restore to base velocity more quickly
            this.vx += (this.baseVx - this.vx) * 0.08;
            this.vy += (this.baseVy - this.vy) * 0.08;

            // Clamp max velocity to prevent particles flying off
            const maxVel = config.speed * 3;
            this.vx = Math.max(-maxVel, Math.min(maxVel, this.vx));
            this.vy = Math.max(-maxVel, Math.min(maxVel, this.vy));

            // Wrap around edges with padding
            const padding = 50;
            if (this.x < -padding) this.x = canvas.width + padding;
            if (this.x > canvas.width + padding) this.x = -padding;
            if (this.y < -padding) this.y = canvas.height + padding;
            if (this.y > canvas.height + padding) this.y = -padding;
        }

        draw() {
            const color = this.isAccent ? config.colors.accent : config.colors.particle;

            // Outer glow
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.currentSize * 4, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${color}, ${this.opacity * 0.15})`;
            ctx.fill();

            // Inner particle
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.currentSize, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${color}, ${this.opacity})`;
            ctx.fill();
        }
    }

    // Draw connections between nearby particles
    function drawConnections() {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const p1 = particles[i];
                const p2 = particles[j];

                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < config.lineDistance) {
                    // Opacity based on distance
                    const opacity = (1 - dist / config.lineDistance) * config.lineOpacity;

                    // Gradient line between particles
                    const gradient = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
                    const color1 = p1.isAccent ? config.colors.accent : config.colors.line;
                    const color2 = p2.isAccent ? config.colors.accent : config.colors.line;
                    gradient.addColorStop(0, `rgba(${color1}, ${opacity})`);
                    gradient.addColorStop(1, `rgba(${color2}, ${opacity})`);

                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.strokeStyle = gradient;
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                }
            }
        }
    }

    // Animation loop
    function animate() {
        if (!isRunning) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Update and draw particles
        particles.forEach(p => p.update());

        // Draw connections first (behind particles)
        drawConnections();

        // Draw particles on top
        particles.forEach(p => p.draw());

        animationId = requestAnimationFrame(animate);
    }

    // Handle resize
    function handleResize() {
        // Set canvas size to match window (since it's position: fixed)
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // Adjust particle count for mobile
        const targetCount = window.innerWidth < 768
            ? Math.floor(config.particleCount * 0.5)
            : config.particleCount;

        // Add or remove particles to match target
        while (particles.length < targetCount) {
            particles.push(new Particle());
        }
        while (particles.length > targetCount) {
            particles.pop();
        }
    }

    // Handle scroll
    function handleScroll() {
        scrollY = window.scrollY;
    }

    // Handle mouse move (window-level for pointer-events: none canvas)
    function handleMouseMove(e) {
        mouseX = e.clientX;
        mouseY = e.clientY;
    }

    // Handle mouse leave (when leaving the window)
    function handleMouseLeave() {
        mouseX = null;
        mouseY = null;
    }

    // Initialize
    function init(canvasId) {
        canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.warn('NetworkBackground: Canvas not found');
            return;
        }

        ctx = canvas.getContext('2d');

        // Initial setup
        handleResize();
        console.log('NetworkBackground: Canvas initialized', canvas.width, 'x', canvas.height);

        // Create initial particles
        particles = [];
        for (let i = 0; i < config.particleCount; i++) {
            particles.push(new Particle());
        }
        console.log('NetworkBackground: Created', particles.length, 'particles');

        // Event listeners
        window.addEventListener('resize', handleResize);
        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('mousemove', handleMouseMove, { passive: true });
        document.addEventListener('mouseleave', handleMouseLeave);

        // Respect reduced motion preference
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) {
            // Draw once and don't animate
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawConnections();
            particles.forEach(p => p.draw());
            return;
        }

        // Start animation
        isRunning = true;
        console.log('NetworkBackground: Animation started');
        animate();
    }

    // Cleanup
    function destroy() {
        isRunning = false;
        if (animationId) {
            cancelAnimationFrame(animationId);
        }
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleScroll);
        window.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseleave', handleMouseLeave);
        particles = [];
    }

    // Public API
    return {
        init,
        destroy,
        // Allow runtime config adjustments
        setConfig: (newConfig) => Object.assign(config, newConfig)
    };
})();

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    NetworkBackground.init('network-canvas');
});

// Make available globally
window.NetworkBackground = NetworkBackground;
