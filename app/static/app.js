    <script>
        // ==============================
        // PARTICLES
        // ==============================
        const canvas = document.getElementById('particles-canvas');
        const ctx = canvas.getContext('2d');
        let particles = [];

        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }

        class Particle {
            constructor() { this.reset(); }
            reset() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * 1.5 + 0.3;
                this.speedX = (Math.random() - 0.5) * 0.3;
                this.speedY = (Math.random() - 0.5) * 0.3;
                this.opacity = Math.random() * 0.2 + 0.05;
                this.color = ['0, 82, 255', '255, 255, 255'][Math.floor(Math.random() * 2)];
            }
            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) this.reset();
            }
            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${this.color}, ${this.opacity})`;
                ctx.fill();
            }
        }

        function initParticles() {
            particles = [];
            for (let i = 0; i < 40; i++) particles.push(new Particle());
        }

        function animateParticles() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => { p.update(); p.draw(); });
            particles.forEach((a, i) => {
                particles.slice(i + 1).forEach(b => {
                    const dist = Math.hypot(a.x - b.x, a.y - b.y);
                    if (dist < 120) {
                        ctx.beginPath();
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(b.x, b.y);
                        ctx.strokeStyle = `rgba(0, 82, 255, ${0.03 * (1 - dist / 120)})`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                });
            });
            requestAnimationFrame(animateParticles);
        }

        resizeCanvas();
        initParticles();
        animateParticles();
        window.addEventListener('resize', () => { resizeCanvas(); initParticles(); });

        // ==============================
        // INTRO ANIMATION
        // ==============================
        const intro = document.getElementById('intro');
        const app = document.getElementById('app');
        const loadingBar = document.getElementById('loading-bar');
        const skipBtn = document.getElementById('skip-btn');
        const introTitle = document.getElementById('intro-title');
        const introSubtitle = document.getElementById('intro-subtitle');
        const introLoadingText = document.getElementById('intro-loading-text');
        let introComplete = false;

        const maskElements = [
            document.getElementById('ml1'), document.getElementById('ml2'),
            document.getElementById('mr1'), document.getElementById('mr2'),
            document.getElementById('mgl'), document.getElementById('mgr'),
            document.getElementById('mgt'), document.getElementById('mf'),
            document.getElementById('mg'), document.getElementById('mm'),
            document.getElementById('eor'),
        ];

        const loadingMessages = [
            'Initializing voice engine...',
            'Connecting Lost Tune agent...',
            'Connecting Speed Draft agent...',
            'Connecting Brook agent...',
            'Loading Gemini & YouTube Music integration...',
            'Pipeline ready. Ask NIKA anything.',
        ];

        function playIntro() {
            let progress = 0;
            const loadInterval = setInterval(() => {
                progress += 2;
                loadingBar.style.width = progress + '%';
                if (progress >= 100) clearInterval(loadInterval);
            }, 70);

            maskElements.forEach((el, i) => {
                setTimeout(() => el.classList.add('reveal'), 300 + i * 120);
            });

            setTimeout(() => introTitle.classList.add('reveal'), 1400);
            setTimeout(() => introSubtitle.classList.add('reveal'), 1700);
            setTimeout(() => introLoadingText.classList.add('reveal'), 1900);

            let msgIdx = 0;
            const msgInterval = setInterval(() => {
                introLoadingText.textContent = loadingMessages[msgIdx];
                msgIdx++;
                if (msgIdx >= loadingMessages.length) clearInterval(msgInterval);
            }, 450);

            setTimeout(() => transitionToApp(), 3400);
        }

        function transitionToApp() {
            if (introComplete) return;
            introComplete = true;
            intro.classList.add('hidden');
            skipBtn.style.display = 'none';
            setTimeout(() => app.classList.add('active'), 500);
        }

        skipBtn.addEventListener('click', transitionToApp);
        setTimeout(playIntro, 200);

        // ==============================
        // PIPELINE MESSAGE CYCLING
        // ==============================
        const pipelineMsg = document.getElementById('pipeline-msg');
        const pipelineMessages = [
            'NIKA is ready. Say "play music", "send email", or try Brook!',
            'Lost Tune: YouTube search engine online.',
            'Speed Draft: Gemini email agent online.',
            'Brook: YouTube Music integration ready.',
            'Snap: Instagram captions ready.',
            'Pitch: LinkedIn posts ready.',
            'Pipeline healthy. 5 agents, 0 errors.',
            'Awaiting voice trigger from NIKA...',
        ];
        let pipelineMsgIdx = 0;

        setInterval(() => {
            pipelineMsg.style.opacity = '0';
            setTimeout(() => {
                pipelineMsgIdx = (pipelineMsgIdx + 1) % pipelineMessages.length;
                pipelineMsg.textContent = pipelineMessages[pipelineMsgIdx];
                pipelineMsg.style.opacity = '1';
            }, 400);
        }, 3500);

        // ==============================
        // PIPELINE STATS
        // ==============================
        let statWorkflows = 1248;
        let statCommands = 3891;

        setInterval(() => {
            statWorkflows += Math.floor(Math.random() * 3) + 1;
            statCommands += Math.floor(Math.random() * 5) + 1;
            document.getElementById('stat-workflows').textContent = statWorkflows.toLocaleString();
            document.getElementById('stat-commands').textContent = statCommands.toLocaleString();
            document.getElementById('stat-resp').textContent = (160 + Math.floor(Math.random() * 60)) + 'ms';
        }, 7200);

        // ==============================
        // YOUTUBE PLAYER
        // ==============================
        let player;
        let playerReady = false;

        const ytTag = document.createElement('script');
        ytTag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(ytTag);

        function onYouTubeIframeAPIReady() {
            player = new YT.Player('youtube-player', {
                height: '100%',
                width: '100%',
                videoId: '',
                playerVars: { autoplay: 1, controls: 1, modestbranding: 1, rel: 0 },
                events: { onReady: () => { playerReady = true; } }
            });
        }

        // ==============================
        // UNIFIED VOICE — SPEECH RECOGNITION
        // ==============================
        const micBtn = document.getElementById('mic-btn');
        const statusText = document.getElementById('status-text');
        const commandInput = document.getElementById('command-input');
        const commandSendBtn = document.getElementById('command-send-btn');
        const waveform = document.getElementById('waveform');
        const historyList = document.getElementById('history-list');
        let isListening = false;
        let recognition = null;
        let commandHistory = [];

        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onstart = () => {
                isListening = true;
                micBtn.classList.add('listening');
                statusText.textContent = 'NIKA is listening...';
                statusText.className = 'voice-status listening';
                waveform.classList.add('active');
                waveform.classList.add('active');
            };

            recognition.onresult = (event) => {
                let transcript = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    transcript += event.results[i][0].transcript;
                }
                updateRecognizedText(transcript);
                if (event.results[event.resultIndex].isFinal) {
                    processCommand(transcript.toLowerCase().trim());
                }
            };

            recognition.onerror = (event) => {
                stopListening();
                if (event.error === 'not-allowed') {
                    statusText.textContent = 'Microphone access denied';
                    statusText.className = 'voice-status error';
                } else if (event.error === 'no-speech') {
                    statusText.textContent = 'No speech detected. Try again.';
                    statusText.className = 'voice-status';
                } else {
                    statusText.textContent = 'Error: ' + event.error;
                    statusText.className = 'voice-status error';
                }
            };

            recognition.onend = () => stopListening();
        } else {
            statusText.textContent = 'Speech not supported. Try Chrome.';
            statusText.className = 'voice-status error';
            micBtn.style.opacity = '0.5';
        }

        function startListening() {
            if (recognition && !isListening) {
                try { recognition.start(); } catch (e) {}
            }
        }

        function stopListening() {
            isListening = false;
            micBtn.classList.remove('listening');
            statusText.textContent = 'Tap mic or press Space to talk to NIKA';
            statusText.className = 'voice-status';
            waveform.classList.remove('active');
        }

        function updateRecognizedText(text) {
            commandInput.value = text;
        }

        // ==============================
        // UNIFIED AGENT PANEL + CONSTELLATION
        // ==============================
        const AGENT_SECTIONS = {
            'lost-tune': 'lost-tune-section',
            'speed-draft': 'speed-draft-section',
            'brook': 'brook-section',
            'snap': 'snap-section',
            'pitch': 'pitch-section'
        };
        const AGENT_NAV = {
            'pipeline': 'pipeline-section',
            'lost-tune': 'agent-panel',
            'speed-draft': 'agent-panel',
            'brook': 'agent-panel',
            'snap': 'agent-panel',
            'pitch': 'agent-panel'
        };

        function setActiveAgent(agentKey) {
            // Panel: show only the active agent's card
            const panel = document.getElementById('agent-panel');
            panel.classList.add('has-active');
            document.querySelectorAll('#agent-panel .agent-card').forEach(card => {
                card.classList.toggle('active', card.id === AGENT_SECTIONS[agentKey]);
            });

            // Constellation: highlight the routed node + edge
            document.querySelectorAll('.const-node').forEach(n => {
                n.classList.toggle('active', n.dataset.agent === agentKey);
            });
            document.querySelectorAll('.const-edge').forEach(e => {
                e.classList.toggle('active', e.dataset.agent === agentKey);
            });
            document.querySelectorAll('.const-dot-active').forEach(d => {
                d.classList.toggle('active', d.dataset.agent === agentKey);
            });

            // Nav highlighting
            document.querySelectorAll('.nav-link').forEach(l => {
                l.classList.toggle('active-nav', l.dataset.agent === agentKey);
            });
        }

        function showAgent(agentKey, scroll) {
            setActiveAgent(agentKey);
            if (scroll !== false) {
                document.getElementById(AGENT_SECTIONS[agentKey]).scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }

        // Scale the constellation to fit its card width
        function fitConstellation() {
            const wrap = document.querySelector('.constellation-wrap');
            if (!wrap) return;
            const card = wrap.closest('.pipeline-card');
            const available = card.clientWidth - 8;
            const scale = Math.min(1, available / 880);
            wrap.style.transform = scale < 1 ? `scale(${scale})` : 'none';
            wrap.style.transformOrigin = 'top center';
            wrap.style.marginBottom = scale < 1 ? `${-470 * (1 - scale)}px` : '0px';
        }
        window.addEventListener('resize', fitConstellation);
        fitConstellation();

        // Nav + constellation node clicks
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (ev) => {
                const agent = link.dataset.agent;
                if (agent && AGENT_SECTIONS[agent]) {
                    ev.preventDefault();
                    showAgent(agent);
                }
            });
        });

        const hubCenter = { x: 450, y: 235 };
        const hubRadius = 68;

        document.querySelectorAll('.const-node').forEach(node => {
            let isDragging = false;
            let startX, startY, initialLeft, initialTop;
            let moved = false;

            // Handle standard click selection
            node.addEventListener('click', (e) => {
                if (!moved) {
                    showAgent(node.dataset.agent);
                }
            });

            // Start dragging
            node.addEventListener('mousedown', (e) => {
                // Ignore right clicks
                if (e.button !== 0) return;

                isDragging = true;
                moved = false;
                startX = e.clientX;
                startY = e.clientY;

                // Fetch the current absolute left/top (ignoring 'px')
                initialLeft = parseInt(node.style.left || 0, 10);
                initialTop = parseInt(node.style.top || 0, 10);

                node.style.zIndex = 100;
                e.preventDefault(); // prevents text selection while dragging
            });

            // Drag move
            window.addEventListener('mousemove', (e) => {
                if (!isDragging) return;

                const wrap = document.querySelector('.constellation-wrap');
                const scale = wrap.style.transform.includes('scale')
                              ? parseFloat(wrap.style.transform.match(/scale\(([^)]+)\)/)[1])
                              : 1;

                const dx = (e.clientX - startX) / scale;
                const dy = (e.clientY - startY) / scale;

                if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
                    moved = true;
                    node.classList.add('dragging');
                }

                if (moved) {
                    const newLeft = initialLeft + dx;
                    const newTop = initialTop + dy;
                    node.style.left = `${newLeft}px`;
                    node.style.top = `${newTop}px`;

                    updateEdges(node, newLeft, newTop);
                }
            });

            // Stop dragging
            window.addEventListener('mouseup', () => {
                if (isDragging) {
                    isDragging = false;
                    node.style.zIndex = '';
                    setTimeout(() => node.classList.remove('dragging'), 50);
                }
            });
        });

        function updateEdges(node, left, top) {
            const agentKey = node.dataset.agent;
            const edge = document.querySelector(`.const-edge[data-agent="${agentKey}"]`);
            if (!edge) return;

            const width = node.offsetWidth || 150;
            const height = node.offsetHeight || 54;

            const nodeCenterX = left + width / 2;
            const nodeCenterY = top + height / 2;

            const dx = nodeCenterX - hubCenter.x;
            const dy = nodeCenterY - hubCenter.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > 0) {
                // Start exactly at NIKA hub radius boundary
                const x1 = hubCenter.x + (dx / dist) * hubRadius;
                const y1 = hubCenter.y + (dy / dist) * hubRadius;

                // End at the edge of the agent node bounding box
                const x2 = nodeCenterX - (dx / dist) * (width / 2 + 10);
                const y2 = nodeCenterY - (dy / dist) * (height / 2 + 5);

                // Update Line Attributes
                edge.setAttribute('x1', x1);
                edge.setAttribute('y1', y1);
                edge.setAttribute('x2', x2);
                edge.setAttribute('y2', y2);

                // Update SVG Animation paths
                const pathStr = `M${x1},${y1} L${x2},${y2}`;
                document.querySelectorAll(`circle[data-agent="${agentKey}"] animateMotion`).forEach(anim => {
                    anim.setAttribute('path', pathStr);
                });
            }
        }

        // ==============================
        // UNIFIED COMMAND ROUTING
        // ==============================
        const MUSIC_KEYWORDS = ['play', 'music', 'song', 'songs', 'artist', 'album', 'genre', 'lofi', 'jazz', 'rock', 'pop', 'classical', 'hip hop', 'electronic', 'beat', 'playlist', 'listen', 'youtube'];
        const EMAIL_KEYWORDS = ['email', 'send', 'draft', 'compose', 'mail', 'message', 'inbox', 'reply', 'forward', 'gmail'];
        const BROOK_KEYWORDS = ['brook', 'youtube music', 'yt music'];
        const INSTAGRAM_KEYWORDS = ['instagram', 'insta', 'caption', 'hashtag', 'hashtags', 'reel'];
        const LINKEDIN_KEYWORDS = ['linkedin', 'professional post', 'job post', 'network'];
        const MAP_KEYWORDS = ['map', 'route', 'directions', 'navigate', 'travel', 'go to', 'reach', 'how to get', 'distance', 'charge', 'ev station', 'where is'];


        function isEmailCommand(text) {
            return EMAIL_KEYWORDS.some(kw => text.includes(kw)) && !text.includes('play');
        }

        function isMusicCommand(text) {
            return MUSIC_KEYWORDS.some(kw => text.includes(kw));
        }

        function isBrookCommand(text) {
            return BROOK_KEYWORDS.some(kw => text.includes(kw));
        }

        function isInstagramCommand(text) {
            return INSTAGRAM_KEYWORDS.some(kw => text.includes(kw));
        }

        function isInstagramOpenCommand(text) {
            if (!isInstagramCommand(text)) return false;
            const OPEN_INTENTS = ['open', 'show', 'view', 'browse', 'check', 'go to', 'launch', 'take me to'];
            return OPEN_INTENTS.some(kw => text.includes(kw));
        }

        function isLinkedInCommand(text) {
            return LINKEDIN_KEYWORDS.some(kw => text.includes(kw));
        }

        function isLinkedInOpenCommand(text) {
            if (!isLinkedInCommand(text)) return false;
            const OPEN_INTENTS = ['open', 'show', 'view', 'browse', 'check', 'go to', 'launch', 'take me to'];
            return OPEN_INTENTS.some(kw => text.includes(kw));
        }

        function isMapCommand(text) {
            return MAP_KEYWORDS.some(kw => text.includes(kw));
        }

        async function processCommand(text) {
            if (isBrookCommand(text)) {
                // ── BROOK: Music via YouTube Music ──
                setActiveAgent('brook');
                statusText.textContent = 'Brook: Searching YouTube Music...';
                statusText.className = 'voice-status processing';
                pipelineMsg.textContent = `Brook: Searching YouTube Music for "${text}"...`;

                try {
                    const resp = await fetch('/brook/play', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ command: text })
                    });
                    const data = await resp.json();

                    if (data.success && data.embed_url) {
                        // Load YouTube Music embed (regular YouTube embed)
                        const spotifyWrap = document.getElementById('spotify-player-wrap');
                        spotifyWrap.innerHTML = `<iframe src="${data.embed_url}" width="100%" height="152" frameBorder="0" allowfullscreen allow="autoplay; encrypted-media; fullscreen; picture-in-picture" loading="lazy" style="border-radius: 12px;"></iframe>`;

                        statusText.textContent = `Brook: Now playing ${data.track}!`;
                        statusText.className = 'voice-status success';
                        pipelineMsg.textContent = `Brook: Playing "${data.track}" on YouTube Music`;

                        // Add to Brook history
                        addBrookTrack(data.track, data.artist);
                    } else if (data.success && data.ytmusic_url) {
                        // Fallback: open YouTube Music search or watch
                        window.open(data.ytmusic_url, '_blank');
                        statusText.textContent = 'Brook: Opened YouTube Music';
                        statusText.className = 'voice-status success';
                        pipelineMsg.textContent = `Brook: Opening "${data.track}" on YouTube Music`;
                        addBrookTrack(data.track, data.artist);
                    } else {
                        throw new Error('No valid URL returned');
                    }
                } catch (err) {
                    // Fallback: open YouTube Music search
                    window.open(`https://music.youtube.com/search?q=${encodeURIComponent(text)}`, '_blank');
                    statusText.textContent = 'Brook: Opened YouTube Music (Fallback)';
                    statusText.className = 'voice-status';
                    console.error('YouTube Music error:', err);
                }

                addToHistory(text, 'brook');
                stopListening();

            } else if (isInstagramCommand(text)) {
                // ── SNAP: Instagram ──
                if (isInstagramOpenCommand(text)) {
                    // "open instagram" / "open latest post of nvidia on instagram" → open directly
                    setActiveAgent('snap');
                    window.open('https://www.instagram.com/', '_blank');
                    statusText.textContent = 'Snap: Opened Instagram!';
                    statusText.className = 'voice-status success';
                    pipelineMsg.textContent = 'Snap: Opening Instagram for you';
                    addToHistory(text, 'instagram');
                    stopListening();
                } else {
                    // "create post" / "write a caption" → generate and show panel
                    setActiveAgent('snap');
                    statusText.textContent = 'Snap: Writing captions...';
                    statusText.className = 'voice-status processing';
                    pipelineMsg.textContent = 'Snap: Generating caption...';

                    try {
                        const resp = await fetch('/instagram/caption', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ command: text })
                        });
                        const data = await resp.json();

                        if (data.success) {
                            document.getElementById('insta-caption').value = data.captions || '';
                            document.getElementById('insta-hashtags').value = data.hashtags || '';

                            const instaOpenBtn = document.getElementById('insta-open-btn');
                            instaOpenBtn.href = data.instagram_url || 'https://www.instagram.com/';
                            instaOpenBtn.classList.add('visible');

                            setInstaStatus('Captions ready! Copy and paste into Instagram.', 'success');
                            statusText.textContent = 'Snap: Captions ready!';
                            statusText.className = 'voice-status success';
                            pipelineMsg.textContent = 'Snap: Caption drafted — copy it and post!';

                            addSnapCaption(data.captions.split('\n')[0] || 'Caption', data.hashtags);
                            document.getElementById('snap-section').scrollIntoView({ behavior: 'smooth', block: 'center' });
                        } else {
                            setInstaStatus(data.message || 'Failed to generate caption.', 'error');
                            statusText.textContent = 'Snap: ' + (data.message || 'Error');
                            statusText.className = 'voice-status error';
                        }
                    } catch (err) {
                        setInstaStatus('Backend not reachable. Is Flask running?', 'error');
                        statusText.textContent = 'Snap: Connection error';
                        statusText.className = 'voice-status error';
                        console.error('Instagram API error:', err);
                    }

                    addToHistory(text, 'instagram');
                    stopListening();
                }

            } else if (isLinkedInCommand(text)) {
                // ── PITCH: LinkedIn ──
                if (isLinkedInOpenCommand(text)) {
                    // "open linkedin" / "open latest post of nvidia on linkedin" → open directly
                    setActiveAgent('pitch');
                    window.open('https://www.linkedin.com/feed/', '_blank');
                    statusText.textContent = 'Pitch: Opened LinkedIn!';
                    statusText.className = 'voice-status success';
                    pipelineMsg.textContent = 'Pitch: Opening LinkedIn for you';
                    addToHistory(text, 'linkedin');
                    stopListening();
                } else {
                    // "create post" / "write a post" → generate and show panel
                    setActiveAgent('pitch');
                    statusText.textContent = 'Pitch: Writing post...';
                    statusText.className = 'voice-status processing';
                    pipelineMsg.textContent = 'Pitch: Generating LinkedIn post...';

                    try {
                        const resp = await fetch('/linkedin/post', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ command: text })
                        });
                        const data = await resp.json();

                        if (data.success) {
                            document.getElementById('linkedin-post').value = data.post || '';

                            const linkedinOpenBtn = document.getElementById('linkedin-open-btn');
                            linkedinOpenBtn.href = data.linkedin_url || 'https://www.linkedin.com/feed/?shareActive=true';
                            linkedinOpenBtn.classList.add('visible');

                            setLinkedinStatus('Post ready! Copy it, then open the LinkedIn composer.', 'success');
                            statusText.textContent = 'Pitch: Post ready!';
                            statusText.className = 'voice-status success';
                            pipelineMsg.textContent = 'Pitch: LinkedIn post drafted — copy and share!';

                            addPitchPost(data.post.split('\n')[0] || 'Post');
                            document.getElementById('pitch-section').scrollIntoView({ behavior: 'smooth', block: 'center' });
                        } else {
                            setLinkedinStatus(data.message || 'Failed to generate post.', 'error');
                            statusText.textContent = 'Pitch: ' + (data.message || 'Error');
                            statusText.className = 'voice-status error';
                        }
                    } catch (err) {
                        setLinkedinStatus('Backend not reachable. Is Flask running?', 'error');
                        statusText.textContent = 'Pitch: Connection error';
                        statusText.className = 'voice-status error';
                        console.error('LinkedIn API error:', err);
                    }

                    addToHistory(text, 'linkedin');
                    stopListening();
                }

            } else if (isEmailCommand(text)) {
                // ── SPEED DRAFT: Email via Gemini ──
                setActiveAgent('speed-draft');
                statusText.textContent = 'Speed Draft: Processing with Gemini...';
                statusText.className = 'voice-status processing';
                pipelineMsg.textContent = 'Speed Draft: Generating email via Gemini...';

                try {
                    const resp = await fetch('/agent', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ command: text })
                    });
                    const data = await resp.json();

                    if (data.success && data.email_generated) {
                        // Fill the Speed Draft form
                        document.getElementById('email-to').value = data.recipient || '';
                        document.getElementById('email-subject').value = data.subject || '';
                        document.getElementById('email-body').value = data.body || '';

                        // Show Gmail link
                        const gmailBtn = document.getElementById('gmail-link-btn');
                        gmailBtn.href = data.gmail_url;
                        gmailBtn.classList.add('visible');

                        setEmailStatus('Email drafted! Review below or open in Gmail.', 'success');
                        statusText.textContent = 'Speed Draft: Email ready!';
                        statusText.className = 'voice-status success';
                        pipelineMsg.textContent = `Speed Draft: Email to ${data.recipient || 'recipient'} — "${data.subject || 'draft'}"`;

                        // Add to recent emails
                        addRecentEmail(data.subject || 'Draft', data.recipient || '—');

                        // Scroll to Speed Draft card
                        document.getElementById('speed-draft-section').scrollIntoView({ behavior: 'smooth', block: 'center' });
                    } else {
                        setEmailStatus(data.message || 'Failed to generate email.', 'error');
                        statusText.textContent = 'Speed Draft: ' + (data.message || 'Error');
                        statusText.className = 'voice-status error';
                    }
                } catch (err) {
                    setEmailStatus('Backend not reachable. Is Flask running?', 'error');
                    statusText.textContent = 'Speed Draft: Connection error';
                    statusText.className = 'voice-status error';
                    console.error('Email API error:', err);
                }

                addToHistory(text, 'email');
                stopListening();

            } else if (isMapCommand(text)) {
                // ── MAP: Google Maps ──
                setActiveAgent('map');
                statusText.textContent = 'Map: Opening Google Maps...';
                statusText.className = 'voice-status processing';
                pipelineMsg.textContent = `Map: Searching maps for "${text}"...`;

                try {
                    const resp = await fetch('/map/route', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ command: text })
                    });
                    const data = await resp.json();

                    if (data.success && data.map_url) {
                        window.open(data.map_url, '_blank');
                        statusText.textContent = 'Map: Opened Google Maps!';
                        statusText.className = 'voice-status success';
                        pipelineMsg.textContent = `Map: Directed to Google Maps`;
                    } else {
                        // Fallback: search raw query
                        window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(text)}`, '_blank');
                        statusText.textContent = 'Map: Opened Google Maps search';
                        statusText.className = 'voice-status';
                    }
                } catch (err) {
                    // Fallback: search raw query
                    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(text)}`, '_blank');
                    statusText.textContent = 'Map: Opened Google Maps (offline mode)';
                    statusText.className = 'voice-status';
                    console.error('Map API error:', err);
                }

                addToHistory(text, 'map');
                stopListening();

            } else if (isMusicCommand(text)) {
                // ── LOST TUNE: Music via YouTube ──
                setActiveAgent('lost-tune');
                statusText.textContent = 'Lost Tune: Searching YouTube...';
                statusText.className = 'voice-status processing';
                pipelineMsg.textContent = `Lost Tune: Searching for "${text}"...`;

                try {
                    const resp = await fetch('/youtube/play', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ command: text })
                    });
                    const data = await resp.json();

                    if (data.success && data.url) {
                        // Load video in iframe
                        const videoContainer = document.getElementById('video-container');
                        videoContainer.classList.add('visible');
                        document.getElementById('video-info').classList.add('visible');
                        document.getElementById('video-title').textContent = data.query || text;
                        document.getElementById('video-channel').textContent = 'Lost Tune · Playing via YouTube';

                        // Use player if ready, else use iframe directly
                        if (playerReady && player && player.loadVideoById) {
                            const videoIdMatch = data.url.match(/embed\/([^?]+)/);
                            if (videoIdMatch) {
                                player.loadVideoById(videoIdMatch[1]);
                            }
                        } else {
                            videoContainer.innerHTML = `<iframe src="${data.url}" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
                        }

                        statusText.textContent = 'Lost Tune: Now playing!';
                        statusText.className = 'voice-status success';
                        pipelineMsg.textContent = `Lost Tune: Playing "${data.query || text}"`;
                    } else {
                        // Fallback: open YouTube search
                        window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(text)}`, '_blank');
                        statusText.textContent = 'Lost Tune: Opened YouTube search';
                        statusText.className = 'voice-status';
                    }
                } catch (err) {
                    // Fallback: open YouTube search
                    window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(text)}`, '_blank');
                    statusText.textContent = 'Lost Tune: Opened YouTube (offline mode)';
                    statusText.className = 'voice-status';
                    console.error('YouTube API error:', err);
                }

                addToHistory(text, 'music');
                stopListening();

            } else {
                // ── AMBIGUOUS: Default to music ──
                statusText.textContent = 'NIKA: Trying as music search...';
                statusText.className = 'voice-status';
                window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(text)}`, '_blank');
                addToHistory(text, 'music');
                stopListening();
            }
        }

        // ==============================
        // HISTORY
        // ==============================
        function addToHistory(text, type) {
            commandHistory.unshift({ text, type, time: new Date() });
            if (commandHistory.length > 10) commandHistory.pop();
            renderHistory();
        }

        function renderHistory() {
            if (commandHistory.length === 0) {
                historyList.innerHTML = '<div class="empty-state">No commands yet. Talk to NIKA!</div>';
                return;
            }
            historyList.innerHTML = commandHistory.map((item, i) => {
                const icon = item.type === 'email' ? '&#9993;' : item.type === 'brook' ? '&#127926;' : item.type === 'instagram' ? '&#128247;' : item.type === 'linkedin' ? '&#128188;' : '&#127925;';
                return `
                <div class="voice-history-item" onclick="replayCommand(${i})">
                    <span class="icon">${icon}</span>
                    <span class="text">${escapeHtml(item.text)}</span>
                    <span class="time">${item.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>`;
            }).join('');
        }

        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        function replayCommand(i) {
            const item = commandHistory[i];
            if (item) {
                updateRecognizedText(item.text);
                processCommand(item.text.toLowerCase().trim());
            }
        }

        // ==============================
        // SNAP AGENT (INSTAGRAM)
        // ==============================
        const instaStatus = document.getElementById('insta-status');
        let recentCaptions = [];

        function setInstaStatus(msg, type) {
            instaStatus.textContent = msg;
            instaStatus.className = 'email-status' + (type ? ' ' + type : '');
        }

        function addSnapCaption(caption, hashtags) {
            recentCaptions.unshift({ caption, hashtags, time: new Date() });
            if (recentCaptions.length > 5) recentCaptions.pop();
            renderRecentCaptions();
        }

        function renderRecentCaptions() {
            const list = document.getElementById('snap-history-list');
            if (recentCaptions.length === 0) {
                list.innerHTML = '<div class="empty-state">No captions yet. Talk to Snap!</div>';
                return;
            }
            list.innerHTML = recentCaptions.map(item => `
                <div class="voice-history-item">
                    <span class="icon">&#128247;</span>
                    <span class="text">${escapeHtml(item.caption)}</span>
                    <span class="time">${item.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
            `).join('');
        }

        document.getElementById('insta-copy-btn').addEventListener('click', async () => {
            const caption = document.getElementById('insta-caption').value.trim();
            const hashtags = document.getElementById('insta-hashtags').value.trim();
            const full = [caption, hashtags].filter(Boolean).join('\n\n');

            if (!full) {
                setInstaStatus('Nothing to copy yet. Ask Snap for a caption!', 'error');
                return;
            }

            try {
                await navigator.clipboard.writeText(full);
                setInstaStatus('Copied! Paste it in your Instagram post.', 'success');
            } catch (err) {
                setInstaStatus('Copy failed — select the text manually.', 'error');
            }
        });

        // ==============================
        // PITCH AGENT (LINKEDIN)
        // ==============================
        const linkedinStatus = document.getElementById('linkedin-status');
        let recentPosts = [];

        function setLinkedinStatus(msg, type) {
            linkedinStatus.textContent = msg;
            linkedinStatus.className = 'email-status' + (type ? ' ' + type : '');
        }

        function addPitchPost(post) {
            recentPosts.unshift({ post, time: new Date() });
            if (recentPosts.length > 5) recentPosts.pop();
            renderRecentPosts();
        }

        function renderRecentPosts() {
            const list = document.getElementById('pitch-history-list');
            if (recentPosts.length === 0) {
                list.innerHTML = '<div class="empty-state">No posts yet. Talk to Pitch!</div>';
                return;
            }
            list.innerHTML = recentPosts.map(item => `
                <div class="voice-history-item">
                    <span class="icon">&#128188;</span>
                    <span class="text">${escapeHtml(item.post)}</span>
                    <span class="time">${item.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
            `).join('');
        }

        document.getElementById('linkedin-copy-btn').addEventListener('click', async () => {
            const post = document.getElementById('linkedin-post').value.trim();

            if (!post) {
                setLinkedinStatus('Nothing to copy yet. Ask Pitch for a post!', 'error');
                return;
            }

            try {
                await navigator.clipboard.writeText(post);
                setLinkedinStatus('Copied! Open the LinkedIn composer and paste.', 'success');
            } catch (err) {
                setLinkedinStatus('Copy failed — select the text manually.', 'error');
            }
        });

        // ==============================
        // EMAIL AGENT
        // ==============================
        const emailSendBtn = document.getElementById('email-send-btn');
        const emailStatus = document.getElementById('email-status');
        const emailRecentList = document.getElementById('email-recent-list');
        let recentEmails = [];

        function setEmailStatus(msg, type) {
            emailStatus.textContent = msg;
            emailStatus.className = 'email-status' + (type ? ' ' + type : '');
        }

        function addRecentEmail(subject, to) {
            recentEmails.unshift({ subject, to, time: new Date() });
            if (recentEmails.length > 5) recentEmails.pop();
            renderRecentEmails();
        }

        function renderRecentEmails() {
            if (recentEmails.length === 0) {
                emailRecentList.innerHTML = '<div class="empty-state">No emails yet. Say "send email" to NIKA!</div>';
                return;
            }
            emailRecentList.innerHTML = recentEmails.map(item => `
                <div class="email-recent-item">
                    <span class="icon">&#9993;</span>
                    <span class="subject">${escapeHtml(item.subject)}</span>
                    <span class="time">${item.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
            `).join('');
        }

        // Manual compose → open Gmail directly
        emailSendBtn.addEventListener('click', async () => {
            const to = document.getElementById('email-to').value.trim();
            const subject = document.getElementById('email-subject').value.trim();
            const body = document.getElementById('email-body').value.trim();

            if (!to && !subject && !body) {
                setEmailStatus('Tell NIKA what to email, or fill the form.', 'error');
                return;
            }

            // If all fields filled, generate via backend and open Gmail
            const command = `send email to ${to} subject ${subject} body ${body}`;
            emailSendBtn.classList.add('sending');
            setEmailStatus('Generating via Gemini...', 'processing');

            try {
                const resp = await fetch('/agent', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ command })
                });
                const data = await resp.json();

                if (data.success && data.gmail_url) {
                    window.open(data.gmail_url, '_blank');
                    setEmailStatus('Opened in Gmail!', 'success');
                    addRecentEmail(subject || 'Draft', to);
                } else {
                    // Fallback: build Gmail URL manually
                    const gmailUrl = `https://mail.google.com/mail/u/0/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                    window.open(gmailUrl, '_blank');
                    setEmailStatus('Opened in Gmail (manual)!', 'success');
                    addRecentEmail(subject || 'Draft', to);
                }
            } catch (err) {
                // Fallback: build Gmail URL manually
                const gmailUrl = `https://mail.google.com/mail/u/0/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                window.open(gmailUrl, '_blank');
                setEmailStatus('Opened in Gmail (offline)!', 'success');
                addRecentEmail(subject || 'Draft', to);
            }

            emailSendBtn.classList.remove('sending');
        });

        // ==============================
        // BROOK (SPOTIFY AGENT)
        // ==============================
        const brookHistoryList = document.getElementById('brook-history-list');
        let recentTracks = [];

        function addBrookTrack(track, artist) {
            recentTracks.unshift({ track, artist, time: new Date() });
            if (recentTracks.length > 5) recentTracks.pop();
            renderBrookTracks();
        }

        function renderBrookTracks() {
            if (recentTracks.length === 0) {
                brookHistoryList.innerHTML = '<div class="empty-state">No tracks yet. Talk to Brook!</div>';
                return;
            }
            brookHistoryList.innerHTML = recentTracks.map(item => `
                <div class="voice-history-item">
                    <span class="icon">&#127926;</span>
                    <span class="text">${escapeHtml(item.track)} — ${escapeHtml(item.artist)}</span>
                    <span class="time">${item.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
            `).join('');
        }

        // ==============================
        // CURSOR TRACKING
        // ==============================
        let mouseX = -9999, mouseY = -9999;

        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });

        document.addEventListener('mouseleave', () => {
            mouseX = -9999;
            mouseY = -9999;
        });

        document.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                mouseX = e.touches[0].clientX;
                mouseY = e.touches[0].clientY;
            }
        }, { passive: true });

        document.addEventListener('touchend', () => {
            mouseX = -9999;
            mouseY = -9999;
        });

        // ==============================
        // PANEL PROXIMITY GLOW
        // ==============================
        const glowPanels = [
            document.querySelector('.pipeline-card'),
            ...document.querySelectorAll('.agent-card')
        ].filter(Boolean);

        const GLOW_RADIUS = 280;

        function updatePanelGlow() {
            glowPanels.forEach(panel => {
                const rect = panel.getBoundingClientRect();
                const cx = rect.left + rect.width / 2;
                const cy = rect.top + rect.height / 2;
                const dx = mouseX - cx;
                const dy = mouseY - cy;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const maxDist = GLOW_RADIUS + Math.max(rect.width, rect.height) / 2;

                if (dist < maxDist) {
                    const t = 1 - dist / maxDist; // 0..1, closer = stronger
                    const intensity = t * t; // quadratic falloff
                    const glowAlpha = (intensity * 0.18).toFixed(3);
                    const borderAlpha = (0.08 + intensity * 0.25).toFixed(3);
                    const brighten = 1 + intensity * 0.12;
                    const blurAmt = Math.round(24 + intensity * 8);

                    panel.style.boxShadow =
                        `0 0 ${20 + intensity * 30}px rgba(0,82,255,${glowAlpha}), ` +
                        `0 8px 32px rgba(0,0,0,${(0.3 - intensity * 0.1).toFixed(2)}), ` +
                        `inset 0 1px 0 rgba(255,255,255,${(0.04 + intensity * 0.08).toFixed(3)})`;
                    panel.style.borderColor = `rgba(0,82,255,${borderAlpha})`;
                    panel.style.backdropFilter = `blur(${blurAmt}px) saturate(${1.4 + intensity * 0.4}) brightness(${brighten})`;
                    panel.style.webkitBackdropFilter = panel.style.backdropFilter;
                } else {
                    panel.style.boxShadow = '';
                    panel.style.borderColor = '';
                    panel.style.backdropFilter = '';
                    panel.style.webkitBackdropFilter = '';
                }
            });
            requestAnimationFrame(updatePanelGlow);
        }

        updatePanelGlow();

        // ==============================
        // EVENT LISTENERS
        // ==============================
        micBtn.addEventListener('click', () => {
            if (isListening) recognition?.stop();
            else startListening();
        });

        // Send typed command
        function sendTypedCommand() {
            const text = commandInput.value.trim();
            if (!text) return;
            processCommand(text.toLowerCase());
            commandInput.value = '';
        }

        commandInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                sendTypedCommand();
            }
            // Stop Space from triggering voice when typing in input
            if (e.code === 'Space') e.stopPropagation();
        });

        commandSendBtn.addEventListener('click', sendTypedCommand);

        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && introComplete && document.activeElement !== commandInput) {
                e.preventDefault();
                if (isListening) recognition?.stop();
                else startListening();
            }
        });

        document.querySelectorAll('.voice-cmd-pill').forEach(btn => {
            btn.addEventListener('click', () => {
                const command = btn.getAttribute('data-command');
                updateRecognizedText(command);
                processCommand(command);
            });
        });

        const urlParams = new URLSearchParams(window.location.search);
        const cmdParam = urlParams.get('command');
        if (cmdParam && introComplete) {
            setTimeout(() => { updateRecognizedText(cmdParam); processCommand(cmdParam.toLowerCase().trim()); }, 500);
        }

    </script>
