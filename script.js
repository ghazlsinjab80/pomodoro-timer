class PomodoroApp {
    constructor() {
        // DOM Elements
        this.minutesDisplay = document.getElementById('minutes');
        this.secondsDisplay = document.getElementById('seconds');
        this.sessionLabel = document.getElementById('sessionLabel');
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.workDurationInput = document.getElementById('workDuration');
        this.breakDurationInput = document.getElementById('breakDuration');
        this.sessionCountDisplay = document.getElementById('sessionCount');
        this.themeToggle = document.getElementById('themeToggle');

        // Audio for notifications
        this.audioContext = null;

        // State
        this.isRunning = false;
        this.isPaused = false;
        this.isWorkSession = true;
        this.sessionCount = 0;
        this.timeLeft = 25 * 60; // in seconds
        this.timerId = null;

        // Bind methods
        this.tick = this.tick.bind(this);
        this.startTimer = this.startTimer.bind(this);
        this.pauseTimer = this.pauseTimer.bind(this);
        this.resetTimer = this.resetTimer.bind(this);
        this.toggleTheme = this.toggleTheme.bind(this);

        // Initialize
        this.updateDisplay();
        this.setupEventListeners();
        this.loadPreferences();
    }

    setupEventListeners() {
        this.startBtn.addEventListener('click', this.startTimer);
        this.pauseBtn.addEventListener('click', this.pauseTimer);
        this.resetBtn.addEventListener('click', this.resetTimer);
        this.themeToggle.addEventListener('click', this.toggleTheme);
        this.workDurationInput.addEventListener('change', () => {
            if (!this.isRunning) {
                this.timeLeft = parseInt(this.workDurationInput.value) * 60;
                this.updateDisplay();
            }
        });
        this.breakDurationInput.addEventListener('change', () => {
            // Just update, no reset needed
        });
    }

    startTimer() {
        if (this.isPaused) {
            this.isPaused = false;
            this.timerId = setInterval(this.tick, 1000);
            this.pauseBtn.textContent = '⏸ Pause';
            this.pauseBtn.disabled = false;
            this.startBtn.disabled = true;
            return;
        }

        if (this.isRunning) return;

        // Reset if not paused and already finished
        if (this.timeLeft <= 0) {
            this.resetTimer();
        }

        this.isRunning = true;
        this.isPaused = false;
        this.pauseBtn.disabled = false;
        this.startBtn.disabled = true;
        this.timerId = setInterval(this.tick, 1000);
    }

    pauseTimer() {
        if (this.isRunning && !this.isPaused) {
            this.isPaused = true;
            clearInterval(this.timerId);
            this.startBtn.disabled = false;
            this.pauseBtn.textContent = '▶ Resume';
            this.startBtn.textContent = '▶ Resume';
        }
    }

    resetTimer() {
        clearInterval(this.timerId);
        this.isRunning = false;
        this.isPaused = false;
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        this.pauseBtn.textContent = '⏸ Pause';
        this.startBtn.textContent = '▶ Start';
        
        // Reset to work or break depending on session
        if (this.isWorkSession) {
            this.timeLeft = parseInt(this.workDurationInput.value) * 60;
            this.sessionLabel.textContent = 'Focus Time';
        } else {
            this.timeLeft = parseInt(this.breakDurationInput.value) * 60;
            this.sessionLabel.textContent = 'Break Time';
        }
        this.updateDisplay();
    }

    tick() {
        this.timeLeft--;
        this.updateDisplay();

        if (this.timeLeft <= 0) {
            this.playNotification();
            this.switchSession();
        }
    }

    switchSession() {
        clearInterval(this.timerId);
        this.isRunning = false;
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        this.startBtn.textContent = '▶ Start';

        if (this.isWorkSession) {
            // Work session completed
            this.isWorkSession = false;
            this.sessionCount++;
            this.sessionCountDisplay.textContent = this.sessionCount;
            this.timeLeft = parseInt(this.breakDurationInput.value) * 60;
            this.sessionLabel.textContent = 'Break Time';
            this.sessionLabel.style.color = '#48bb78';
            this.showNotification('Break Time!', 'Take a well-deserved break 🧘');
        } else {
            // Break completed
            this.isWorkSession = true;
            this.timeLeft = parseInt(this.workDurationInput.value) * 60;
            this.sessionLabel.textContent = 'Focus Time';
            this.sessionLabel.style.color = '#667eea';
            this.showNotification('Focus Time!', 'Let\'s get back to work 💪');
        }

        this.updateDisplay();
        this.savePreferences();
    }

    updateDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        this.minutesDisplay.textContent = String(minutes).padStart(2, '0');
        this.secondsDisplay.textContent = String(seconds).padStart(2, '0');
    }

    playNotification() {
        try {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            // Play two beeps
            const frequencies = [800, 1000];
            frequencies.forEach((freq, index) => {
                setTimeout(() => {
                    const oscillator = this.audioContext.createOscillator();
                    const gainNode = this.audioContext.createGain();
                    oscillator.connect(gainNode);
                    gainNode.connect(this.audioContext.destination);
                    oscillator.frequency.value = freq;
                    oscillator.type = 'sine';
                    gainNode.gain.value = 0.3;
                    oscillator.start();
                    setTimeout(() => {
                        oscillator.stop();
                    }, 200);
                }, index * 300);
            });
        } catch (error) {
            console.log('Audio not available');
        }
    }

    showNotification(title, body) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
                body: body,
                icon: '🍅'
            });
        } else if ('Notification' in window && Notification.permission !== 'denied') {
            Notification.requestPermission();
        }
    }

    toggleTheme() {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        this.themeToggle.textContent = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }

    loadPreferences() {
        // Load theme
        const theme = localStorage.getItem('theme');
        if (theme === 'dark') {
            document.body.classList.add('dark-mode');
            this.themeToggle.textContent = '☀️ Light Mode';
        }

        // Load session count
        const savedSessions = localStorage.getItem('pomodoroSessions');
        if (savedSessions) {
            this.sessionCount = parseInt(savedSessions);
            this.sessionCountDisplay.textContent = this.sessionCount;
        }

        // Load durations
        const savedWork = localStorage.getItem('pomodoroWork');
        const savedBreak = localStorage.getItem('pomodoroBreak');
        if (savedWork) {
            this.workDurationInput.value = savedWork;
            if (!this.isRunning) {
                this.timeLeft = parseInt(savedWork) * 60;
                this.updateDisplay();
            }
        }
        if (savedBreak) {
            this.breakDurationInput.value = savedBreak;
        }

        // Request notification permission
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }

    savePreferences() {
        localStorage.setItem('pomodoroSessions', this.sessionCount);
        localStorage.setItem('pomodoroWork', this.workDurationInput.value);
        localStorage.setItem('pomodoroBreak', this.breakDurationInput.value);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new PomodoroApp();
});