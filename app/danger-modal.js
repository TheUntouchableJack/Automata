// ===== Danger Confirmation Modal =====
// A reusable modal for destructive actions with flames animation and evil laugh

const DangerModal = (function() {
    let modalElement = null;
    let flamesOverlay = null;
    let currentCallback = null;
    let requiredPhrase = '';
    let audioContext = null;

    // Initialize the modal HTML
    function init() {
        if (document.getElementById('danger-modal-overlay')) return;

        // Create modal HTML
        const modalHTML = `
            <div class="danger-modal-overlay" id="danger-modal-overlay">
                <div class="danger-modal">
                    <div class="danger-banner">
                        <div class="danger-banner-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                            </svg>
                        </div>
                        <div class="danger-banner-content">
                            <div class="danger-banner-title" id="danger-banner-title">Danger Zone</div>
                            <div class="danger-banner-subtitle">This action cannot be undone</div>
                        </div>
                    </div>
                    <div class="danger-modal-body">
                        <div class="danger-item-name" id="danger-item-name"></div>
                        <p class="danger-warning-text" id="danger-warning-text"></p>
                        <label class="danger-confirmation-label">Type the following to confirm:</label>
                        <div class="danger-confirmation-phrase" id="danger-confirmation-phrase"></div>
                        <input type="text" class="danger-confirmation-input" id="danger-confirmation-input" autocomplete="off" spellcheck="false">
                    </div>
                    <div class="danger-modal-footer">
                        <button class="btn-cancel" id="danger-cancel-btn">Cancel</button>
                        <button class="btn-destroy" id="danger-confirm-btn" disabled>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M3 4H13M6 4V3C6 2.44772 6.44772 2 7 2H9C9.55228 2 10 2.44772 10 3V4M12 4V13C12 13.5523 11.5523 14 11 14H5C4.44772 14 4 13.5523 4 13V4H12Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            <span id="danger-confirm-text">Destroy</span>
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Create flames overlay HTML
        const flamesHTML = `
            <div class="flames-overlay" id="flames-overlay">
                <div class="flames-container" id="flames-container"></div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        document.body.insertAdjacentHTML('beforeend', flamesHTML);

        modalElement = document.getElementById('danger-modal-overlay');
        flamesOverlay = document.getElementById('flames-overlay');

        // Event listeners
        document.getElementById('danger-cancel-btn').addEventListener('click', close);
        document.getElementById('danger-confirm-btn').addEventListener('click', handleConfirm);

        const input = document.getElementById('danger-confirmation-input');
        input.addEventListener('input', checkConfirmation);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !document.getElementById('danger-confirm-btn').disabled) {
                handleConfirm();
            }
        });

        modalElement.addEventListener('click', (e) => {
            if (e.target === modalElement) close();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modalElement.classList.contains('active')) {
                close();
            }
        });
    }

    // Show the modal
    function show(options) {
        init();

        const {
            title = 'Danger Zone',
            itemName = '',
            warningText = 'This action is permanent and cannot be undone. All associated data will be permanently deleted.',
            confirmPhrase = 'DELETE',
            confirmButtonText = 'Destroy',
            onConfirm = null
        } = options;

        document.getElementById('danger-banner-title').textContent = title;
        document.getElementById('danger-item-name').textContent = itemName;
        document.getElementById('danger-warning-text').textContent = warningText;
        document.getElementById('danger-confirmation-phrase').textContent = confirmPhrase;
        document.getElementById('danger-confirm-text').textContent = confirmButtonText;
        document.getElementById('danger-confirmation-input').value = '';

        requiredPhrase = confirmPhrase;
        currentCallback = onConfirm;

        const confirmBtn = document.getElementById('danger-confirm-btn');
        confirmBtn.disabled = true;
        confirmBtn.classList.remove('enabled');

        modalElement.classList.add('active');

        // Focus the input after animation
        setTimeout(() => {
            document.getElementById('danger-confirmation-input').focus();
        }, 300);
    }

    // Check if confirmation phrase matches
    function checkConfirmation() {
        const input = document.getElementById('danger-confirmation-input');
        const confirmBtn = document.getElementById('danger-confirm-btn');
        const value = input.value.toUpperCase();

        if (value === requiredPhrase) {
            confirmBtn.disabled = false;
            confirmBtn.classList.add('enabled');
            input.classList.add('matched');
        } else {
            confirmBtn.disabled = true;
            confirmBtn.classList.remove('enabled');
            input.classList.remove('matched');
        }
    }

    // Handle confirmation
    async function handleConfirm() {
        const confirmBtn = document.getElementById('danger-confirm-btn');
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = `
            <div class="loading-spinner" style="width: 16px; height: 16px; border-width: 2px;"></div>
            <span>Destroying...</span>
        `;

        // Close modal first
        modalElement.classList.remove('active');

        // Play the destruction animation
        await playDestructionAnimation();

        // Execute callback
        if (currentCallback) {
            try {
                await currentCallback();
            } catch (error) {
                console.error('Error during destruction:', error);
            }
        }

        // Reset button
        confirmBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 4H13M6 4V3C6 2.44772 6.44772 2 7 2H9C9.55228 2 10 2.44772 10 3V4M12 4V13C12 13.5523 11.5523 14 11 14H5C4.44772 14 4 13.5523 4 13V4H12Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span id="danger-confirm-text">Destroy</span>
        `;
    }

    // Play destruction animation with flames and evil laugh
    async function playDestructionAnimation() {
        return new Promise((resolve) => {
            // Add shake effect
            document.body.classList.add('shaking');

            // Play evil laugh
            playEvilLaugh();

            // Show flames
            flamesOverlay.classList.add('active');
            createFlames();

            // Show skull
            const skull = document.createElement('div');
            skull.className = 'skull-icon';
            skull.innerHTML = '💀';
            document.body.appendChild(skull);

            // Clean up after animation
            setTimeout(() => {
                document.body.classList.remove('shaking');
                flamesOverlay.classList.remove('active');
                document.getElementById('flames-container').innerHTML = '';
                skull.remove();
                resolve();
            }, 2500);
        });
    }

    // Create flame elements
    function createFlames() {
        const container = document.getElementById('flames-container');
        container.innerHTML = '';

        // Create main flames along the bottom
        const flameCount = Math.floor(window.innerWidth / 80);
        for (let i = 0; i < flameCount; i++) {
            const flame = document.createElement('div');
            flame.className = 'flame';
            flame.style.left = `${(i / flameCount) * 100}%`;
            flame.style.width = `${80 + Math.random() * 60}px`;
            flame.style.height = `${150 + Math.random() * 150}px`;
            flame.style.animationDelay = `${Math.random() * 0.3}s`;
            flame.style.animationDuration = `${0.3 + Math.random() * 0.4}s`;
            container.appendChild(flame);
        }

        // Create embers
        for (let i = 0; i < 50; i++) {
            const ember = document.createElement('div');
            ember.className = 'ember';
            ember.style.left = `${Math.random() * 100}%`;
            ember.style.bottom = '0';
            ember.style.animationDelay = `${Math.random() * 2}s`;
            ember.style.animationDuration = `${1 + Math.random() * 1.5}s`;
            ember.style.background = ['#ff4500', '#ff6b35', '#ffa500', '#ffd700'][Math.floor(Math.random() * 4)];
            container.appendChild(ember);
        }
    }

    // Play evil laugh using Web Audio API
    function playEvilLaugh() {
        try {
            // Create audio context if not exists
            if (!audioContext) {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }

            // Generate evil laugh sound
            const duration = 2;
            const sampleRate = audioContext.sampleRate;
            const buffer = audioContext.createBuffer(1, sampleRate * duration, sampleRate);
            const data = buffer.getChannelData(0);

            // Create a creepy laugh pattern
            const laughPatterns = [
                { start: 0, duration: 0.3, freq: 150 },
                { start: 0.35, duration: 0.25, freq: 140 },
                { start: 0.65, duration: 0.3, freq: 130 },
                { start: 1.0, duration: 0.25, freq: 120 },
                { start: 1.3, duration: 0.4, freq: 110 },
                { start: 1.75, duration: 0.25, freq: 100 }
            ];

            for (let i = 0; i < data.length; i++) {
                const t = i / sampleRate;
                let sample = 0;

                for (const pattern of laughPatterns) {
                    if (t >= pattern.start && t < pattern.start + pattern.duration) {
                        const localT = (t - pattern.start) / pattern.duration;
                        const envelope = Math.sin(localT * Math.PI); // Simple envelope
                        const vibrato = Math.sin(t * 6 * Math.PI) * 10; // Vibrato
                        const freq = pattern.freq + vibrato + (localT * -20); // Pitch drop

                        // Mix of frequencies for richer sound
                        sample += envelope * 0.3 * Math.sin(2 * Math.PI * freq * t);
                        sample += envelope * 0.2 * Math.sin(2 * Math.PI * freq * 1.5 * t);
                        sample += envelope * 0.1 * Math.sin(2 * Math.PI * freq * 2 * t);

                        // Add some noise for raspiness
                        sample += envelope * 0.1 * (Math.random() * 2 - 1);
                    }
                }

                data[i] = sample * 0.5; // Master volume
            }

            const source = audioContext.createBufferSource();
            source.buffer = buffer;

            // Add reverb-like effect with delay
            const gainNode = audioContext.createGain();
            gainNode.gain.value = 0.7;

            source.connect(gainNode);
            gainNode.connect(audioContext.destination);

            source.start();
        } catch (e) {
            console.log('Could not play evil laugh:', e);
        }
    }

    // Close the modal
    function close() {
        if (modalElement) {
            modalElement.classList.remove('active');
        }
        currentCallback = null;
    }

    // Public API
    return {
        show,
        close
    };
})();

// Make available globally
window.DangerModal = DangerModal;
