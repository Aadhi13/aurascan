/**
 * AuraScan v3.8 - Quantum Bio-Frequency Analyzer & Prank Engine
 */

(function () {
  // DOM Elements
  const logoBadge = document.getElementById('logoBadge');
  const soundToggle = document.getElementById('soundToggle');
  const soundIcon = soundToggle.querySelector('.sound-icon');
  const rigToggleBtn = document.getElementById('rigToggleBtn');
  const rigModal = document.getElementById('rigModal');
  const closeRigModal = document.getElementById('closeRigModal');
  const saveRigSettings = document.getElementById('saveRigSettings');
  const targetKeywordsInput = document.getElementById('targetKeywords');
  const segBtns = document.querySelectorAll('.seg-btn');

  // Views
  const uploadSection = document.getElementById('uploadSection');
  const scanSection = document.getElementById('scanSection');
  const resultSection = document.getElementById('resultSection');

  // Upload Elements
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const uploadPlaceholder = document.getElementById('uploadPlaceholder');
  const previewContainer = document.getElementById('previewContainer');
  const imagePreview = document.getElementById('imagePreview');
  const removePhotoBtn = document.getElementById('removePhotoBtn');
  const subjectNameInput = document.getElementById('subjectName');
  const startScanBtn = document.getElementById('startScanBtn');
  const zoneTR = document.getElementById('zoneTR');
  const zoneTL = document.getElementById('zoneTL');

  // Scanner Elements
  const scannerImage = document.getElementById('scannerImage');
  const scannerCanvas = document.getElementById('scannerCanvas');
  const ctx = scannerCanvas.getContext('2d');
  const scanStatusText = document.getElementById('scanStatusText');
  const scanTimer = document.getElementById('scanTimer');
  const dataStreamText = document.getElementById('dataStreamText');
  const progressBar = document.getElementById('progressBar');

  // Scanner Metric Bars & Values
  const mIris = document.getElementById('mIris');
  const barIris = document.getElementById('barIris');
  const mAura = document.getElementById('mAura');
  const barAura = document.getElementById('barAura');
  const mPheromone = document.getElementById('mPheromone');
  const barPheromone = document.getElementById('barPheromone');
  const mChroma = document.getElementById('mChroma');
  const barChroma = document.getElementById('barChroma');

  // Result Elements
  const resultSubjectName = document.getElementById('resultSubjectName');
  const resultPhoto = document.getElementById('resultPhoto');
  const resultBadge = document.getElementById('resultBadge');
  const resultTitle = document.getElementById('resultTitle');
  const confidenceVal = document.getElementById('confidenceVal');
  const metricFab = document.getElementById('metricFab');
  const metricSass = document.getElementById('metricSass');
  const metricVibe = document.getElementById('metricVibe');
  const metricNote = document.getElementById('metricNote');
  const scanAgainBtn = document.getElementById('scanAgainBtn');
  const shareResultBtn = document.getElementById('shareResultBtn');

  const toast = document.getElementById('toast');

  // App State
  let soundEnabled = true;
  let currentFile = null;
  let currentImageSrc = null;
  let forcedMode = 'AUTO'; // AUTO, FORCE_GAY, FORCE_STRAIGHT
  let secretTapOverride = null; // 'GAY' or 'STRAIGHT'
  let targetKeywords = ['target', 'rashmie', 'reshmie', 'resshmie'];
  targetKeywordsInput.value = targetKeywords.join(', ');
  let logoTapCount = 0;
  let logoTapTimer = null;
  let scanAnimationId = null;
  let scanStartTime = 0;

  const PRANK_PASSWORD = "QuantumRig!99";
  let toastTimeout = null;

  // Web Audio Context for Sound Effects
  let audioCtx = null;

  function getAudioContext() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playSound(type) {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;

      if (type === 'beep') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(1760, now + 0.1);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === 'scan') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(600, now + 0.3);
        gain.gain.setValueAtTime(0.03, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === 'result_gay') {
        // Upward Arpeggio / Fanfare
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = 'triangle';
          o.frequency.setValueAtTime(freq, now + i * 0.1);
          g.gain.setValueAtTime(0.1, now + i * 0.1);
          g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.4);
          o.connect(g);
          g.connect(ctx.destination);
          o.start(now + i * 0.1);
          o.stop(now + i * 0.1 + 0.4);
        });
      } else if (type === 'result_straight') {
        // Solid Synth Power Tone
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.4);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
      }
    } catch (e) {
      console.warn('Audio failed:', e);
    }
  }

  // Toast Helper
  function showToast(message, duration = 2500) {
    toast.textContent = message;
    toast.classList.remove('hidden');
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toast.classList.add('hidden');
    }, duration);
  }

  // Header Controls
  soundToggle.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    soundIcon.textContent = soundEnabled ? '🔊' : '🔇';
    showToast(soundEnabled ? 'Sound FX Enabled' : 'Sound FX Muted');
  });

  function attemptOpenRig() {
    const pass = window.prompt("🔐 ENTER SECURITY CLEARANCE CODE:");
    if (pass === PRANK_PASSWORD) {
      rigModal.classList.remove('hidden');
      playSound('beep');
      showToast('🔓 Stealth Prank Menu Opened');
    } else if (pass !== null) {
      showToast('❌ Access Denied');
    }
  }

  // Stealth Logo Triple Tap
  logoBadge.addEventListener('click', () => {
    logoTapCount++;
    clearTimeout(logoTapTimer);
    logoTapTimer = setTimeout(() => {
      if (logoTapCount >= 3) {
        attemptOpenRig();
      }
      logoTapCount = 0;
    }, 500);
  });

  rigToggleBtn.addEventListener('click', () => {
    attemptOpenRig();
  });

  closeRigModal.addEventListener('click', () => {
    rigModal.classList.add('hidden');
  });

  // Segmented Control
  segBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      segBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      forcedMode = btn.getAttribute('data-value');
    });
  });

  saveRigSettings.addEventListener('click', () => {
    const kw = targetKeywordsInput.value.toLowerCase().split(',').map((s) => s.trim()).filter(Boolean);
    targetKeywords = kw;
    rigModal.classList.add('hidden');
    showToast(`Prank Settings Saved! Mode: ${forcedMode}`);
  });

  // File Upload Handlers
  function handleFileSelect(file) {
    if (!file || !file.type.startsWith('image/')) {
      showToast('Please select a valid image file');
      return;
    }

    currentFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      currentImageSrc = e.target.result;
      imagePreview.src = currentImageSrc;
      scannerImage.src = currentImageSrc;
      resultPhoto.src = currentImageSrc;

      uploadPlaceholder.classList.add('hidden');
      previewContainer.classList.remove('hidden');
      startScanBtn.classList.remove('disabled');
      startScanBtn.removeAttribute('disabled');
      playSound('beep');
    };
    reader.readAsDataURL(file);
  }

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  });

  removePhotoBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    currentFile = null;
    currentImageSrc = null;
    secretTapOverride = null;
    imagePreview.src = '';
    fileInput.value = '';
    previewContainer.classList.add('hidden');
    uploadPlaceholder.classList.remove('hidden');
    startScanBtn.classList.add('disabled');
    startScanBtn.setAttribute('disabled', 'true');
  });

  // Drag & Drop
  ['dragenter', 'dragover'].forEach((eventName) => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.add('drag-over');
    });
  });

  ['dragleave', 'drop'].forEach((eventName) => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove('drag-over');
    });
  });

  dropZone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    if (dt.files && dt.files.length > 0) {
      handleFileSelect(dt.files[0]);
    }
  });

  // Stealth Secret Tap Zones on Photo Upload Container
  zoneTR.addEventListener('click', (e) => {
    e.stopPropagation();
    secretTapOverride = 'GAY';
    // No toast to remain completely stealthy
    fileInput.click();
  });

  zoneTL.addEventListener('click', (e) => {
    e.stopPropagation();
    secretTapOverride = 'STRAIGHT';
    // No toast to remain completely stealthy
    fileInput.click();
  });

  // START SCANNING PROCESS
  startScanBtn.addEventListener('click', () => {
    if (!currentImageSrc) return;

    uploadSection.classList.add('hidden');
    scanSection.classList.remove('hidden');
    playSound('scan');

    initCanvas();
    runScanProcess();
  });

  // Canvas HUD Face Reticle & Nodes Animation
  function initCanvas() {
    const rect = scannerBoxRect();
    scannerCanvas.width = rect.width;
    scannerCanvas.height = rect.height;
  }

  function scannerBoxRect() {
    return document.querySelector('.scanner-box').getBoundingClientRect();
  }

  function runScanProcess() {
    scanStartTime = Date.now();
    const duration = 4800; // 4.8 seconds total theatrical scan
    let progress = 0;

    const dataLogs = [
      'INITIALIZING BIOMETRIC MESH...',
      'FACIAL LANDMARK IDENTIFICATION...',
      'ANALYZING IRIS CHROMATIC RESONANCE...',
      'DEEP NEURAL SPECTRUM EXTRACTION...',
      'PHEROMONE WAVELENGTH MAPPING...',
      'COMPUTING FINAL ORIENTATION INDEX...'
    ];

    const nodes = [];
    const numNodes = 14;
    const w = scannerCanvas.width || 300;
    const h = scannerCanvas.height || 300;

    for (let i = 0; i < numNodes; i++) {
      nodes.push({
        x: w * (0.3 + Math.random() * 0.4),
        y: h * (0.2 + Math.random() * 0.5),
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        radius: Math.random() * 3 + 2
      });
    }

    function animateScanner() {
      const elapsed = Date.now() - scanStartTime;
      progress = Math.min(100, (elapsed / duration) * 100);
      progressBar.style.width = `${progress}%`;

      // Update timer display
      const seconds = (elapsed / 1000).toFixed(1);
      scanTimer.textContent = `00:${seconds.padStart(4, '0')}`;

      // Update Data Stream & Status text
      const logIdx = Math.min(dataLogs.length - 1, Math.floor((progress / 100) * dataLogs.length));
      scanStatusText.textContent = dataLogs[logIdx];
      dataStreamText.textContent = `HEX_HASH: 0x${Math.floor(Math.random() * 0xffffff).toString(16).toUpperCase()} | SIGNAL: ${(progress * 1.4).toFixed(1)}Hz`;

      // Update metric progress bars
      barIris.style.width = `${Math.min(100, progress * 1.1)}%`;
      mIris.textContent = progress > 30 ? `${(70 + Math.random() * 25).toFixed(1)}nm` : 'ANALYZING...';

      barAura.style.width = `${Math.min(100, progress * 0.95)}%`;
      mAura.textContent = progress > 50 ? `${(8.4 + Math.random() * 1.5).toFixed(2)} GHz` : 'MAPPING...';

      barPheromone.style.width = `${Math.min(100, progress * 1.05)}%`;
      mPheromone.textContent = progress > 70 ? `${(94 + Math.random() * 5).toFixed(1)}% RADIANT` : 'COMPUTING...';

      barChroma.style.width = `${Math.min(100, progress)}%`;
      mChroma.textContent = progress > 85 ? 'SPECTRUM MATCHED' : 'ALIGNING...';

      // Draw Canvas AI Mesh & Connecting Lines
      ctx.clearRect(0, 0, w, h);

      // Draw Connecting Facial Grid
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
      ctx.lineWidth = 1;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dist = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
          if (dist < 90) {
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      // Update & Draw Nodes
      nodes.forEach((n) => {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < w * 0.25 || n.x > w * 0.75) n.vx *= -1;
        if (n.y < h * 0.15 || n.y > h * 0.75) n.vy *= -1;

        ctx.fillStyle = '#ec4899';
        ctx.shadowColor = '#ec4899';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Target Eye Reticles
      const eyeY = h * 0.38;
      const eyeL = w * 0.42;
      const eyeR = w * 0.58;

      [eyeL, eyeR].forEach((ex) => {
        ctx.strokeStyle = 'rgba(236, 72, 153, 0.8)';
        ctx.beginPath();
        ctx.arc(ex, eyeY, 14 + Math.sin(elapsed / 150) * 3, 0, Math.PI * 2);
        ctx.stroke();
      });

      if (progress < 100) {
        if (Math.random() < 0.2) playSound('beep');
        scanAnimationId = requestAnimationFrame(animateScanner);
      } else {
        // Complete Scan!
        setTimeout(revealResults, 400);
      }
    }

    scanAnimationId = requestAnimationFrame(animateScanner);
  }

  // PRANK DECISION ENGINE
  function calculateOutcome() {
    // 1. Secret Tap Override
    if (secretTapOverride) {
      return secretTapOverride;
    }

    // 2. Forced Mode Setting
    if (forcedMode === 'FORCE_GAY') return 'GAY';
    if (forcedMode === 'FORCE_STRAIGHT') return 'STRAIGHT';

    // 3. Subject Name Check
    const enteredName = subjectNameInput.value.trim().toLowerCase();
    const fileName = currentFile ? currentFile.name.toLowerCase() : '';

    const isMatch = targetKeywords.some((kw) => {
      if (!kw) return false;
      const lowerKw = kw.toLowerCase();
      return enteredName.includes(lowerKw) || fileName.includes(lowerKw);
    });

    if (isMatch) return 'GAY';

    // Default Prank Rule: Always return GAY if no explicit rule matched (or 95% gay probability for practical jokes!)
    return 'GAY';
  }

  // REVEAL RESULT VIEW
  function revealResults() {
    scanSection.classList.add('hidden');
    resultSection.classList.remove('hidden');

    const outcome = calculateOutcome();
    const name = subjectNameInput.value.trim() || (currentFile ? currentFile.name.replace(/\.[^/.]+$/, '') : 'Subject');

    resultSubjectName.textContent = name;

    const fabQuotes = [
      '"Subconscious energy signature exceeds 400 TeraFlops of pure elegance."',
      '"High-frequency aura detected. Irresistible charismatic spectrum."',
      '"Biometric alignment indicates 99.9% probability of main character energy."',
      '"Aura scan confirms undeniable flair and immaculate taste."'
    ];

    if (outcome === 'GAY') {
      playSound('result_gay');

      if (typeof confetti === 'function') {
        const duration = 3000;
        const end = Date.now() + duration;
        (function frame() {
          confetti({
            particleCount: 5,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#0000ff', '#4b0082', '#9400d3']
          });
          confetti({
            particleCount: 5,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#0000ff', '#4b0082', '#9400d3']
          });
          if (Date.now() < end) {
            requestAnimationFrame(frame);
          }
        }());
      }

      resultBadge.innerHTML = '🌈';
      resultTitle.textContent = '100% GAY';
      resultTitle.className = 'result-title gay-result';
      confidenceVal.textContent = (99.1 + Math.random() * 0.8).toFixed(1) + '%';
      metricFab.textContent = (98.5 + Math.random() * 1.4).toFixed(1) + ' / 100';
      metricSass.textContent = 'MAXIMUM RADIANCE ✨';
      metricVibe.textContent = 'Rainbow Ultra ✨';
      metricNote.textContent = fabQuotes[Math.floor(Math.random() * fabQuotes.length)];
    } else {
      playSound('result_straight');
      resultBadge.innerHTML = '⚡';
      resultTitle.textContent = '100% STRAIGHT';
      resultTitle.className = 'result-title straight-result';
      confidenceVal.textContent = (98.4 + Math.random() * 1.5).toFixed(1) + '%';
      metricFab.textContent = (45.0 + Math.random() * 10).toFixed(1) + ' / 100';
      metricSass.textContent = 'STANDARD';
      metricVibe.textContent = 'Monochrome / Minimal';
      metricNote.textContent = '"Biometric frequencies exhibit standard baseline spectrum."';
    }
  }

  // RE-SCAN & SHARE BUTTONS
  scanAgainBtn.addEventListener('click', () => {
    resultSection.classList.add('hidden');
    uploadSection.classList.remove('hidden');
    secretTapOverride = null;
    removePhotoBtn.click();
  });

  shareResultBtn.addEventListener('click', async () => {
    const outcomeText = resultTitle.textContent;
    const name = resultSubjectName.textContent;
    const shareData = {
      title: 'AuraScan AI Result',
      text: `⚡ AuraScan AI scanned ${name}'s biometric profile: ${outcomeText}! Try it yourself!`,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Share canceled');
      }
    } else {
      navigator.clipboard.writeText(shareData.text);
      showToast('📋 Result copied to clipboard!');
    }
  });

})();
