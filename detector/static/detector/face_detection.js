class FaceDetector {
    constructor() {
        this.video = document.getElementById('video');
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.resultsDiv = document.getElementById('results');
        this.isDetecting = false;
        this.detectionBoxes = [];
        this.csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
        this.lastDetectionTime = 0;
        this.detectionInterval = 100;
        this.pendingDetection = false;
        this.detectedFaces = new Map(); // Store detected faces with their IDs
        this.nextFaceId = 1;
        
        // Performance monitoring
        this.fpsCounter = document.getElementById('fpsCounter');
        this.latencyCounter = document.getElementById('latencyCounter');
        this.cameraStatus = document.getElementById('cameraStatus');
        this.detectionStatus = document.getElementById('detectionStatus');
        this.frameCount = 0;
        this.lastFpsUpdate = performance.now();
        this.fps = 0;
    }

    async startDetection() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    frameRate: { ideal: 30 }
                } 
            });
            this.video.srcObject = stream;
            this.isDetecting = true;
            this.cameraStatus.textContent = 'Active';
            this.cameraStatus.className = 'text-green-500';
            this.detectionStatus.textContent = 'Running';
            this.detectionStatus.className = 'text-green-500';
            this.detectFaces();
        } catch (err) {
            console.error('Error accessing camera:', err);
            this.cameraStatus.textContent = 'Error';
            this.cameraStatus.className = 'text-red-500';
            this.updateResults('Error accessing camera. Please ensure you have granted camera permissions.');
        }
    }

    // Calculate distance between two points
    calculateDistance(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }

    // Find the closest existing face to a new detection
    findClosestFace(newFace) {
        let closestFace = null;
        let minDistance = 100; // Threshold for considering faces the same

        for (const [id, face] of this.detectedFaces) {
            const distance = this.calculateDistance(
                (newFace.x1 + newFace.x2) / 2,
                (newFace.y1 + newFace.y2) / 2,
                (face.x1 + face.x2) / 2,
                (face.y1 + face.y2) / 2
            );

            if (distance < minDistance) {
                minDistance = distance;
                closestFace = { id, face };
            }
        }

        return minDistance < 100 ? closestFace : null;
    }

    updatePerformanceStats() {
        this.frameCount++;
        const now = performance.now();
        if (now - this.lastFpsUpdate >= 1000) {
            this.fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate));
            this.fpsCounter.textContent = this.fps;
            this.frameCount = 0;
            this.lastFpsUpdate = now;
        }
    }

    async detectFaces() {
        if (!this.isDetecting) return;

        const now = Date.now();
        if (now - this.lastDetectionTime < this.detectionInterval || this.pendingDetection) {
            requestAnimationFrame(() => this.detectFaces());
            return;
        }

        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;
        this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);

        const imageData = this.canvas.toDataURL('image/jpeg', 0.7);
        const detectionStartTime = performance.now();

        this.pendingDetection = true;
        this.lastDetectionTime = now;

        try {
            const response = await fetch('/api/detect/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.csrfToken
                },
                body: JSON.stringify({ image: imageData })
            });

            const data = await response.json();
            
            if (data.success) {
                // Process new detections
                const newDetections = data.faces;
                const updatedFaces = new Map();

                for (const newFace of newDetections) {
                    const closest = this.findClosestFace(newFace);
                    
                    if (closest) {
                        // Update position but keep original age/gender
                        updatedFaces.set(closest.id, {
                            ...closest.face,
                            x1: newFace.x1,
                            y1: newFace.y1,
                            x2: newFace.x2,
                            y2: newFace.y2,
                            timestamp: new Date().toISOString()
                        });
                    } else {
                        // New face detected
                        const faceId = this.nextFaceId++;
                        updatedFaces.set(faceId, {
                            ...newFace,
                            id: faceId,
                            timestamp: new Date().toISOString()
                        });
                    }
                }

                this.detectedFaces = updatedFaces;
                this.drawDetectionBoxes();
                this.updateResults(Array.from(updatedFaces.values()));
            } else {
                this.updateResults('Error detecting faces: ' + (data.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error:', error);
            this.updateResults('Error processing image');
        } finally {
            this.pendingDetection = false;
            const latency = Math.round(performance.now() - detectionStartTime);
            this.latencyCounter.textContent = `${latency}ms`;
            this.updatePerformanceStats();
            requestAnimationFrame(() => this.detectFaces());
        }
    }

    drawDetectionBoxes() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);

        for (const face of this.detectedFaces.values()) {
            // Draw glowing box
            this.ctx.strokeStyle = '#00ffff';
            this.ctx.lineWidth = 2;
            this.ctx.shadowColor = '#00ffff';
            this.ctx.shadowBlur = 10;
            this.ctx.strokeRect(face.x1, face.y1, face.x2 - face.x1, face.y2 - face.y1);
            this.ctx.shadowBlur = 0;
            
            // Prepare label text
            const label = `Face #${face.id}: ${face.gender} (${face.age} years)`;
            const confidence = `Detected at: ${new Date(face.timestamp).toLocaleTimeString()}`;
            
            // Draw label background with glow effect
            const textWidth = Math.max(
                this.ctx.measureText(label).width,
                this.ctx.measureText(confidence).width
            );
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.shadowColor = '#00ffff';
            this.ctx.shadowBlur = 5;
            this.ctx.fillRect(face.x1, face.y1 - 40, textWidth + 10, 35);
            this.ctx.shadowBlur = 0;
            
            // Draw text
            this.ctx.fillStyle = '#00ffff';
            this.ctx.font = '16px Orbitron';
            this.ctx.fillText(label, face.x1 + 5, face.y1 - 25);
            this.ctx.fillText(confidence, face.x1 + 5, face.y1 - 10);
        }
    }

    updateResults(faces) {
        if (typeof faces === 'string') {
            this.resultsDiv.innerHTML = `
                <div class="cyber-card p-4 rounded-lg">
                    <p class="text-gray-400">${faces}</p>
                </div>
            `;
            return;
        }

        if (faces.length === 0) {
            this.resultsDiv.innerHTML = `
                <div class="cyber-card p-4 rounded-lg">
                    <p class="text-gray-400">No faces detected</p>
                </div>
            `;
            return;
        }

        const resultsHtml = faces.map(face => `
            <div class="cyber-card p-4 rounded-lg mb-4 transform transition-all duration-300 hover:scale-105">
                <div class="flex items-center justify-between mb-2">
                    <p class="text-cyan-400 font-bold text-xl">Face #${face.id}</p>
                    <span class="text-sm text-gray-400">${new Date(face.timestamp).toLocaleTimeString()}</span>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <p class="text-gray-400">Gender</p>
                        <p class="text-cyan-400 font-bold">${face.gender}</p>
                    </div>
                    <div>
                        <p class="text-gray-400">Age</p>
                        <p class="text-cyan-400 font-bold">${face.age} years</p>
                    </div>
                </div>
            </div>
        `).join('');

        this.resultsDiv.innerHTML = resultsHtml;
    }

    stopDetection() {
        this.isDetecting = false;
        if (this.video.srcObject) {
            this.video.srcObject.getTracks().forEach(track => track.stop());
        }
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.cameraStatus.textContent = 'Inactive';
        this.cameraStatus.className = 'text-yellow-500';
        this.detectionStatus.textContent = 'Stopped';
        this.detectionStatus.className = 'text-yellow-500';
        this.updateResults('Detection stopped');
    }
}

// Initialize the detector
const detector = new FaceDetector();

// Add event listeners
document.getElementById('startButton').addEventListener('click', () => {
    if (detector.isDetecting) {
        detector.stopDetection();
        document.getElementById('startButton').textContent = 'Start Detection';
        document.getElementById('startButton').classList.remove('glow');
        document.getElementById('startButton').classList.add('pulse');
    } else {
        detector.startDetection();
        document.getElementById('startButton').textContent = 'Stop Detection';
        document.getElementById('startButton').classList.remove('pulse');
        document.getElementById('startButton').classList.add('glow');
    }
}); 