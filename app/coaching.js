// ===== In-App Coaching System =====
// Lightweight, skippable coaching marks that highlight key UI elements for new users

const Coaching = (function() {
    const STORAGE_KEY = 'automata_coaching_completed';
    let currentOverlay = null;
    let currentTour = null;
    let currentStepIndex = 0;

    // Define coaching tours for different pages
    const TOURS = {
        dashboard: [
            {
                target: '#new-project-btn',
                title: 'Create Your First Project',
                description: 'Projects organize your automations and customers. Start here!',
                position: 'bottom'
            },
            {
                target: '.nav-link[href*="automations"]',
                title: 'Automations Library',
                description: 'View and manage all your automations across projects.',
                position: 'bottom'
            },
            {
                target: '.nav-link[href*="customers"]',
                title: 'Customer Database',
                description: 'Import and manage your customer list here.',
                position: 'bottom'
            }
        ],
        project: [
            {
                target: '#new-automation-btn',
                title: 'Create Automations',
                description: 'Add email campaigns, workflows, and more to this project.',
                position: 'left'
            },
            {
                target: '#run-diagnosis-btn',
                title: 'AI Suggestions',
                description: 'Let AI analyze your business and suggest tailored automations.',
                position: 'left'
            },
            {
                target: '.tab[data-tab="customers"]',
                title: 'Add Customers',
                description: 'Assign customers to this project for targeted automations.',
                position: 'bottom'
            }
        ],
        automation: [
            {
                target: '#automation-name, .automation-name-input',
                title: 'Name Your Automation',
                description: 'Give it a clear, descriptive name that explains what it does.',
                position: 'bottom'
            },
            {
                target: '#automation-frequency, .frequency-select',
                title: 'Set Frequency',
                description: 'Choose how often this automation should run.',
                position: 'bottom'
            },
            {
                target: '#publish-btn, .publish-btn, #activate-btn',
                title: 'Publish When Ready',
                description: 'Review your settings, then publish to activate the automation.',
                position: 'left'
            }
        ]
    };

    /**
     * Check if a tour has been completed
     */
    function isCompleted(tourName) {
        try {
            const completed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
            return completed[tourName] === true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Mark a tour as completed
     */
    function markCompleted(tourName) {
        try {
            const completed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
            completed[tourName] = true;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(completed));
        } catch (e) {
            console.warn('Could not save coaching completion:', e);
        }
    }

    /**
     * Reset all tours (for testing)
     */
    function resetTours() {
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (e) {
            console.warn('Could not reset coaching tours:', e);
        }
    }

    /**
     * Show a coaching tour
     */
    function showTour(tourName) {
        // Don't show if already completed
        if (isCompleted(tourName)) return;

        const steps = TOURS[tourName];
        if (!steps || steps.length === 0) return;

        currentTour = tourName;
        currentStepIndex = 0;

        // Find first valid step
        while (currentStepIndex < steps.length) {
            const target = document.querySelector(steps[currentStepIndex].target);
            if (target) break;
            currentStepIndex++;
        }

        if (currentStepIndex >= steps.length) {
            // No valid targets found
            return;
        }

        renderOverlay(steps);
        showStep(currentStepIndex);
    }

    /**
     * Render the coaching overlay
     */
    function renderOverlay(steps) {
        // Remove any existing overlay
        if (currentOverlay) {
            currentOverlay.remove();
        }

        const overlay = document.createElement('div');
        overlay.className = 'coaching-overlay';
        overlay.innerHTML = `
            <div class="coaching-backdrop"></div>
            <div class="coaching-spotlight"></div>
            <div class="coaching-tooltip">
                <div class="coaching-step-indicator">
                    ${steps.map((_, i) => `<span class="dot ${i === 0 ? 'active' : ''}"></span>`).join('')}
                </div>
                <h4 class="coaching-title"></h4>
                <p class="coaching-description"></p>
                <div class="coaching-actions">
                    <button class="coaching-skip">Skip Tour</button>
                    <button class="coaching-next">Next</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        currentOverlay = overlay;

        // Add event listeners
        overlay.querySelector('.coaching-skip').addEventListener('click', skipTour);
        overlay.querySelector('.coaching-next').addEventListener('click', nextStep);
        overlay.querySelector('.coaching-backdrop').addEventListener('click', skipTour);

        // Handle keyboard
        document.addEventListener('keydown', handleKeydown);
    }

    /**
     * Show a specific step
     */
    function showStep(index) {
        const steps = TOURS[currentTour];
        if (!steps || index >= steps.length) {
            completeTour();
            return;
        }

        const step = steps[index];
        const target = document.querySelector(step.target);

        if (!target) {
            // Skip to next step if target doesn't exist
            nextStep();
            return;
        }

        // Update spotlight position
        positionSpotlight(target);

        // Update tooltip content and position
        updateTooltip(step, index, steps.length);

        // Add highlight class to target
        document.querySelectorAll('.coaching-highlight').forEach(el => {
            el.classList.remove('coaching-highlight');
        });
        target.classList.add('coaching-highlight');

        // Scroll target into view if needed
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    /**
     * Position the spotlight around the target element
     */
    function positionSpotlight(target) {
        const spotlight = currentOverlay.querySelector('.coaching-spotlight');
        const rect = target.getBoundingClientRect();
        const padding = 8;

        spotlight.style.top = `${rect.top - padding + window.scrollY}px`;
        spotlight.style.left = `${rect.left - padding}px`;
        spotlight.style.width = `${rect.width + padding * 2}px`;
        spotlight.style.height = `${rect.height + padding * 2}px`;
    }

    /**
     * Update tooltip content and position
     */
    function updateTooltip(step, index, total) {
        const tooltip = currentOverlay.querySelector('.coaching-tooltip');
        const target = document.querySelector(step.target);
        const rect = target.getBoundingClientRect();

        // Update content
        tooltip.querySelector('.coaching-title').textContent = step.title;
        tooltip.querySelector('.coaching-description').textContent = step.description;

        // Update step indicators
        const dots = tooltip.querySelectorAll('.coaching-step-indicator .dot');
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i <= index);
            dot.classList.toggle('current', i === index);
        });

        // Update button text
        const nextBtn = tooltip.querySelector('.coaching-next');
        nextBtn.textContent = index === total - 1 ? 'Got it!' : 'Next';

        // Position tooltip based on step.position
        const tooltipWidth = 300;
        const tooltipHeight = tooltip.offsetHeight || 200;
        const margin = 16;

        let top, left;

        switch (step.position) {
            case 'top':
                top = rect.top - tooltipHeight - margin + window.scrollY;
                left = rect.left + rect.width / 2 - tooltipWidth / 2;
                break;
            case 'bottom':
                top = rect.bottom + margin + window.scrollY;
                left = rect.left + rect.width / 2 - tooltipWidth / 2;
                break;
            case 'left':
                top = rect.top + rect.height / 2 - tooltipHeight / 2 + window.scrollY;
                left = rect.left - tooltipWidth - margin;
                break;
            case 'right':
                top = rect.top + rect.height / 2 - tooltipHeight / 2 + window.scrollY;
                left = rect.right + margin;
                break;
            default:
                top = rect.bottom + margin + window.scrollY;
                left = rect.left + rect.width / 2 - tooltipWidth / 2;
        }

        // Keep tooltip within viewport
        left = Math.max(margin, Math.min(left, window.innerWidth - tooltipWidth - margin));
        top = Math.max(margin, top);

        tooltip.style.top = `${top}px`;
        tooltip.style.left = `${left}px`;
    }

    /**
     * Go to next step
     */
    function nextStep() {
        currentStepIndex++;
        const steps = TOURS[currentTour];

        // Find next valid step
        while (currentStepIndex < steps.length) {
            const target = document.querySelector(steps[currentStepIndex].target);
            if (target) break;
            currentStepIndex++;
        }

        if (currentStepIndex >= steps.length) {
            completeTour();
        } else {
            showStep(currentStepIndex);
        }
    }

    /**
     * Skip/close the tour
     */
    function skipTour() {
        completeTour();
    }

    /**
     * Complete the tour (mark as done and clean up)
     */
    function completeTour() {
        markCompleted(currentTour);
        cleanup();

        // Subtle celebration
        if (typeof celebrateSubtle === 'function') {
            celebrateSubtle();
        }
    }

    /**
     * Clean up overlay and event listeners
     */
    function cleanup() {
        if (currentOverlay) {
            currentOverlay.remove();
            currentOverlay = null;
        }

        // Remove highlight from any elements
        document.querySelectorAll('.coaching-highlight').forEach(el => {
            el.classList.remove('coaching-highlight');
        });

        // Remove keyboard listener
        document.removeEventListener('keydown', handleKeydown);

        currentTour = null;
        currentStepIndex = 0;
    }

    /**
     * Handle keyboard navigation
     */
    function handleKeydown(e) {
        if (e.key === 'Escape') {
            skipTour();
        } else if (e.key === 'Enter' || e.key === 'ArrowRight') {
            nextStep();
        }
    }

    /**
     * Check if any tour is currently active
     */
    function isActive() {
        return currentOverlay !== null;
    }

    /**
     * Add a custom tour programmatically
     */
    function addTour(name, steps) {
        TOURS[name] = steps;
    }

    // Public API
    return {
        showTour,
        isCompleted,
        markCompleted,
        resetTours,
        isActive,
        addTour
    };
})();

// Make available globally
window.Coaching = Coaching;
