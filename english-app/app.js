// ============================================
// APP.JS — English For Kids Logic
// Flashcard + Quiz modes + Audio Pronunciation
// ============================================

(function () {
    'use strict';

    // ---------- STATE ----------
    let currentTopic = null;
    let currentWordIndex = 0;
    let quizQuestions = [];
    let quizIndex = 0;
    let score = 0;
    let totalQuestions = 0;
    let answered = false;

    // ---------- DOM REFS ----------
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    const screens = {
        home: $('#home-screen'),
        topic: $('#topic-screen'),
        learn: $('#learn-screen'),
        play: $('#play-screen'),
        result: $('#result-screen'),
    };

    // ---------- AUDIO SYSTEM ----------
    let audioUnlocked = false;

    function unlockAudio() {
        if (audioUnlocked) return;
        
        // Unlock AudioContext
        const ctx = getAudioCtx();
        if (ctx.state === 'suspended') ctx.resume();
        
        // Unlock Speech API on first gesture (crucial for Android/iOS).
        // Use a real character, NOT '' — an empty utterance throws
        // "synthesis-failed" on Chrome Android and jams the queue so every
        // later speak() silently fails.
        if ('speechSynthesis' in window) {
            try {
                window.speechSynthesis.cancel();
                const u = new SpeechSynthesisUtterance(' '); // non-breaking space
                u.volume = 0;
                window.speechSynthesis.speak(u);
                window.speechSynthesis.resume();
            } catch (e) { /* ignore */ }
        }
        
        audioUnlocked = true;
        // Remove listeners once unlocked
        document.removeEventListener('click', unlockAudio);
        document.removeEventListener('touchstart', unlockAudio);
    }

    // Web Speech API for pronunciation
    function speakWord(text, rate = 0.8) {
        if (!('speechSynthesis' in window)) return;
        const synth = window.speechSynthesis;

        // Chrome/Android bug: after the first word the engine gets stuck
        // (speaking/paused stays true and no sound comes out). Fully reset
        // AND resume it before every utterance — resume() is the key part
        // that "unsticks" the engine on Android.
        try { synth.cancel(); } catch (e) {}
        try { synth.resume(); } catch (e) {}

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US'; // Force US English (important for Android fallback)
        utterance.rate = rate;   // Slow for kids
        utterance.pitch = 1.1;   // Slightly higher pitch, friendlier
        utterance.volume = 1;

        // Try to find an English voice
        const voices = synth.getVoices();
        if (voices.length > 0) {
            const enVoice = voices.find(v => v.lang && v.lang.startsWith('en') && /female/i.test(v.name))
                         || voices.find(v => v.lang && v.lang.startsWith('en-US'))
                         || voices.find(v => v.lang && v.lang.startsWith('en'));
            if (enVoice) utterance.voice = enVoice;
        }

        // A small delay after cancel() plus a resume() kick right after
        // speak() are both needed to keep Chrome Android reliable.
        setTimeout(() => {
            try {
                synth.speak(utterance);
                synth.resume();
            } catch (e) {}
        }, 60);
    }

    // Sound effects using AudioContext
    let audioCtx = null;
    function getAudioCtx() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        return audioCtx;
    }

    function playCorrectSound() {
        try {
            const ctx = getAudioCtx();
            // Happy ascending chime
            const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
            notes.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.type = 'sine';
                osc.frequency.value = freq;
                gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.15);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.15 + 0.4);
                osc.start(ctx.currentTime + i * 0.15);
                osc.stop(ctx.currentTime + i * 0.15 + 0.4);
            });
        } catch (e) { /* silent fail */ }
    }

    function playWrongSound() {
        try {
            const ctx = getAudioCtx();
            // Gentle low buzz
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.value = 220; // A3
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.3);
        } catch (e) { /* silent fail */ }
    }

    function playClickSound() {
        try {
            const ctx = getAudioCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.value = 880;
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.1);
        } catch (e) { /* silent fail */ }
    }

    function playWinSound() {
        try {
            const ctx = getAudioCtx();
            // Victory fanfare
            const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
            notes.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.type = 'triangle';
                osc.frequency.value = freq;
                gain.gain.setValueAtTime(0.25, ctx.currentTime + i * 0.2);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.2 + 0.5);
                osc.start(ctx.currentTime + i * 0.2);
                osc.stop(ctx.currentTime + i * 0.2 + 0.5);
            });
        } catch (e) { /* silent fail */ }
    }

    // Preload voices (some browsers load async)
    if ('speechSynthesis' in window) {
        window.speechSynthesis.getVoices();
        window.speechSynthesis.onvoiceschanged = () => {
            window.speechSynthesis.getVoices();
        };
    }

    // ---------- INIT ----------
    function init() {
        // Bind unlock events immediately
        document.addEventListener('click', unlockAudio);
        document.addEventListener('touchstart', unlockAudio, { passive: true });
        
        injectSpeakButtons();
        renderTopics();
        bindEvents();
    }

    // Dynamically inject speak buttons if not present in HTML
    function injectSpeakButtons() {
        // Add speak button to flashcard if not already there
        const flashcard = $('#flashcard');
        if (flashcard && !$('#btn-speak-learn')) {
            const flashcardEn = $('#flashcard-en');
            const btn = document.createElement('button');
            btn.className = 'btn-speak';
            btn.id = 'btn-speak-learn';
            btn.setAttribute('aria-label', 'Nghe phát âm');
            btn.textContent = '🔊';
            flashcardEn.insertAdjacentElement('afterend', btn);
        }

        // Add speak button to quiz if not already there
        const quizEmoji = $('#quiz-emoji');
        if (quizEmoji && !$('#btn-speak-quiz')) {
            const btn = document.createElement('button');
            btn.className = 'btn-speak btn-speak-quiz';
            btn.id = 'btn-speak-quiz';
            btn.setAttribute('aria-label', 'Nghe phát âm');
            btn.textContent = '🔊 Nghe';
            quizEmoji.insertAdjacentElement('afterend', btn);
        }
    }

    // ---------- SCREEN NAVIGATION ----------
    function showScreen(name) {
        Object.values(screens).forEach(s => s.classList.remove('active'));
        screens[name].classList.add('active');
        // Re-trigger animation
        screens[name].style.animation = 'none';
        screens[name].offsetHeight; // force reflow
        screens[name].style.animation = '';
    }

    // ---------- RENDER TOPICS GRID ----------
    function renderTopics() {
        const grid = $('#topics-grid');
        grid.innerHTML = TOPICS.map(topic => `
            <button class="topic-card" data-topic-id="${topic.id}" 
                    style="background: ${topic.gradient}">
                ${topic.banner ? `<div class="topic-card-banner"><img src="${topic.banner}" alt="${topic.name}"></div>` : ''}
                <span class="topic-card-icon">${topic.icon}</span>
                <div class="topic-card-name">${topic.name}</div>
                <div class="topic-card-name-vi">${topic.nameVi}</div>
            </button>
        `).join('');
    }

    // ---------- BIND EVENTS ----------
    function bindEvents() {
        // Topic cards
        $('#topics-grid').addEventListener('click', (e) => {
            const card = e.target.closest('.topic-card');
            if (!card) return;
            playClickSound();
            const topicId = card.dataset.topicId;
            currentTopic = TOPICS.find(t => t.id === topicId);
            if (currentTopic) openTopic();
        });

        // Back buttons
        $('#btn-back-home').addEventListener('click', () => { playClickSound(); showScreen('home'); });
        $('#btn-back-topic-learn').addEventListener('click', () => { playClickSound(); showScreen('topic'); });
        $('#btn-back-topic-play').addEventListener('click', () => { playClickSound(); showScreen('topic'); });

        // Mode buttons
        $('#btn-learn').addEventListener('click', () => { playClickSound(); startLearn(); });
        $('#btn-play').addEventListener('click', () => { playClickSound(); startPlay(); });

        // Flashcard nav
        $('#btn-prev').addEventListener('click', prevWord);
        $('#btn-next').addEventListener('click', nextWord);

        // Speak buttons
        const btnSpeakLearn = $('#btn-speak-learn');
        if (btnSpeakLearn) {
            btnSpeakLearn.addEventListener('click', (e) => {
                e.stopPropagation();
                const word = currentTopic.words[currentWordIndex];
                if (word) speakWord(word.en);
            });
        }

        const btnSpeakQuiz = $('#btn-speak-quiz');
        if (btnSpeakQuiz) {
            btnSpeakQuiz.addEventListener('click', (e) => {
                e.stopPropagation();
                const word = quizQuestions[quizIndex];
                if (word) speakWord(word.en);
            });
        }

        // Quiz
        $('#btn-continue').addEventListener('click', () => { playClickSound(); nextQuizQuestion(); });

        // Result actions
        $('#btn-replay').addEventListener('click', () => { playClickSound(); startPlay(); });
        $('#btn-go-home').addEventListener('click', () => { playClickSound(); showScreen('home'); });

        // Keyboard support
        document.addEventListener('keydown', handleKey);

        // Swipe support for flashcards
        let touchStartX = 0;
        const flashcard = $('#flashcard');
        flashcard.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
        }, { passive: true });
        flashcard.addEventListener('touchend', (e) => {
            const diff = e.changedTouches[0].clientX - touchStartX;
            if (Math.abs(diff) > 50) {
                if (diff > 0) prevWord();
                else nextWord();
            }
        }, { passive: true });
    }

    function handleKey(e) {
        if (!screens.learn.classList.contains('active') &&
            !screens.play.classList.contains('active')) return;

        if (screens.learn.classList.contains('active')) {
            if (e.key === 'ArrowLeft') prevWord();
            if (e.key === 'ArrowRight') nextWord();
            if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                const word = currentTopic.words[currentWordIndex];
                if (word) speakWord(word.en);
            }
        }
    }

    // ---------- OPEN TOPIC ----------
    function openTopic() {
        $('#topic-icon').textContent = currentTopic.icon;
        $('#topic-title').textContent = `${currentTopic.name} — ${currentTopic.nameVi}`;
        showScreen('topic');
    }

    // ---------- LEARN MODE (Flashcard) ----------
    function startLearn() {
        currentWordIndex = 0;
        $('#learn-icon').textContent = currentTopic.icon;
        $('#learn-title').textContent = currentTopic.nameVi;
        showScreen('learn');
        renderFlashcard();
    }

    function renderFlashcard() {
        const words = currentTopic.words;
        const word = words[currentWordIndex];

        // Animate the card
        const card = $('#flashcard');
        card.style.animation = 'none';
        card.offsetHeight;
        card.style.animation = 'cardAppear 0.4s ease-out';

        // Animate the emoji
        const emojiEl = $('#flashcard-emoji');
        emojiEl.style.animation = 'none';
        emojiEl.offsetHeight;
        emojiEl.style.animation = 'emojiPop 0.5s ease-out';

        $('#flashcard-emoji').textContent = word.emoji;
        $('#flashcard-en').textContent = word.en;
        $('#flashcard-vi').textContent = word.vi;

        // Progress
        const progress = ((currentWordIndex + 1) / words.length) * 100;
        $('#learn-progress-bar').style.width = progress + '%';
        $('#learn-progress-info').textContent = `${currentWordIndex + 1}/${words.length}`;

        // Nav button states
        $('#btn-prev').style.opacity = currentWordIndex === 0 ? '0.4' : '1';
        $('#btn-prev').style.pointerEvents = currentWordIndex === 0 ? 'none' : 'auto';

        // Auto-pronounce the word after a short delay
        setTimeout(() => speakWord(word.en), 500);
    }

    function prevWord() {
        if (currentWordIndex > 0) {
            playClickSound();
            currentWordIndex--;
            renderFlashcard();
        }
    }

    function nextWord() {
        if (currentWordIndex < currentTopic.words.length - 1) {
            playClickSound();
            currentWordIndex++;
            renderFlashcard();
        }
    }

    // ---------- PLAY MODE (Quiz) ----------
    function startPlay() {
        score = 0;
        quizIndex = 0;
        answered = false;
        $('#score-value').textContent = '0';
        $('#play-icon').textContent = currentTopic.icon;
        $('#play-title').textContent = currentTopic.nameVi;

        // Create quiz questions (shuffle words)
        quizQuestions = shuffleArray([...currentTopic.words]);
        totalQuestions = quizQuestions.length;

        showScreen('play');
        renderQuizQuestion();
    }

    function renderQuizQuestion() {
        if (quizIndex >= quizQuestions.length) {
            showResult();
            return;
        }

        answered = false;
        const word = quizQuestions[quizIndex];

        // Animate emoji
        const emojiEl = $('#quiz-emoji');
        emojiEl.style.animation = 'none';
        emojiEl.offsetHeight;
        emojiEl.style.animation = 'emojiPop 0.5s ease-out';

        $('#quiz-emoji').textContent = word.emoji;
        $('#quiz-feedback').classList.add('hidden');

        // Progress
        const progress = ((quizIndex + 1) / totalQuestions) * 100;
        $('#play-progress-bar').style.width = progress + '%';

        // Generate answers: correct + 3 wrong from same topic
        const wrongAnswers = currentTopic.words
            .filter(w => w.en !== word.en);
        const selectedWrong = shuffleArray(wrongAnswers).slice(0, 3);
        const allAnswers = shuffleArray([word, ...selectedWrong]);

        const answersContainer = $('#quiz-answers');
        answersContainer.innerHTML = allAnswers.map(a => `
            <button class="quiz-answer-btn" data-answer="${a.en}">
                ${a.en}
                <span class="answer-vi">${a.vi}</span>
            </button>
        `).join('');

        // Bind answer clicks
        answersContainer.querySelectorAll('.quiz-answer-btn').forEach(btn => {
            btn.addEventListener('click', () => handleAnswer(btn, word.en));
        });

        // Auto-pronounce the word for the quiz question
        setTimeout(() => speakWord(word.en), 600);
    }

    function handleAnswer(btn, correctAnswer) {
        if (answered) return;
        answered = true;

        const isCorrect = btn.dataset.answer === correctAnswer;
        const allBtns = $$('.quiz-answer-btn');

        // Highlight correct/wrong
        allBtns.forEach(b => {
            b.style.pointerEvents = 'none';
            if (b.dataset.answer === correctAnswer) {
                b.classList.add('correct');
            }
        });

        if (isCorrect) {
            score++;
            $('#score-value').textContent = score;
            btn.classList.add('correct');
            playCorrectSound();
            // Pronounce the correct word after the chime
            setTimeout(() => speakWord(correctAnswer, 0.7), 500);
            showFeedback(true);
            createStarBurst(btn);
        } else {
            btn.classList.add('wrong');
            playWrongSound();
            // Pronounce the correct answer so the child learns
            setTimeout(() => speakWord(correctAnswer, 0.7), 600);
            showFeedback(false, correctAnswer);
        }
    }

    function showFeedback(isCorrect, correctAnswer) {
        const feedback = $('#quiz-feedback');
        feedback.classList.remove('hidden');

        const messages = isCorrect
            ? ['Giỏi lắm! 🎉', 'Tuyệt vời! 🌟', 'Đúng rồi! ✨', 'Xuất sắc! 🏆', 'Hay quá! 👏']
            : ['Cố lên nhé! 💪', 'Gần đúng rồi! 🤗', 'Lần sau sẽ đúng! 🌈'];

        $('#feedback-icon').textContent = isCorrect ? '🎉' : '🤗';
        $('#feedback-text').textContent = messages[Math.floor(Math.random() * messages.length)];
        $('#feedback-text').style.color = isCorrect ? '#2E7D32' : '#E65100';
    }

    function nextQuizQuestion() {
        quizIndex++;
        renderQuizQuestion();
    }

    // ---------- RESULT ----------
    function showResult() {
        showScreen('result');

        const percent = Math.round((score / totalQuestions) * 100);
        let title, message, stars;

        if (percent === 100) {
            title = 'Hoàn hảo! 🏆';
            message = 'Bé giỏi quá! Tất cả đều đúng!';
            stars = '⭐⭐⭐';
        } else if (percent >= 70) {
            title = 'Giỏi lắm! 🎉';
            message = 'Bé làm rất tốt! Cố gắng thêm nhé!';
            stars = '⭐⭐';
        } else if (percent >= 40) {
            title = 'Tốt lắm! 👍';
            message = 'Bé cần ôn lại một chút nhé!';
            stars = '⭐';
        } else {
            title = 'Cố lên nào! 💪';
            message = 'Hãy học lại rồi chơi tiếp nhé!';
            stars = '🌟';
        }

        $('#result-title').textContent = title;
        $('#result-stars').textContent = stars;
        $('#result-score-text').textContent = `Bé đã trả lời đúng ${score}/${totalQuestions} câu!`;
        $('#result-message').textContent = message;

        // Sound + Confetti if good score
        if (percent >= 70) {
            playWinSound();
            createConfetti();
        }
    }

    // ---------- EFFECTS ----------
    function createStarBurst(element) {
        const rect = element.getBoundingClientRect();
        const stars = ['⭐', '✨', '🌟', '💫'];
        for (let i = 0; i < 5; i++) {
            const star = document.createElement('div');
            star.className = 'star-burst';
            star.textContent = stars[Math.floor(Math.random() * stars.length)];
            star.style.left = (rect.left + rect.width / 2 + (Math.random() - 0.5) * 80) + 'px';
            star.style.top = (rect.top + Math.random() * 30) + 'px';
            star.style.animationDelay = (i * 0.1) + 's';
            document.body.appendChild(star);
            setTimeout(() => star.remove(), 1200);
        }
    }

    function createConfetti() {
        const container = $('#confetti-container');
        container.innerHTML = '';
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96E6A1', '#FFE66D',
                         '#FF9FF3', '#54A0FF', '#5F27CD', '#FF9F43', '#EE5A24'];
        for (let i = 0; i < 60; i++) {
            const piece = document.createElement('div');
            piece.className = 'confetti-piece';
            piece.style.left = Math.random() * 100 + 'vw';
            piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            piece.style.animationDuration = (2 + Math.random() * 3) + 's';
            piece.style.animationDelay = (Math.random() * 2) + 's';
            piece.style.width = (8 + Math.random() * 10) + 'px';
            piece.style.height = (8 + Math.random() * 10) + 'px';
            piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '3px';
            container.appendChild(piece);
        }
        // Cleanup after animation
        setTimeout(() => { container.innerHTML = ''; }, 6000);
    }

    // ---------- UTILS ----------
    function shuffleArray(arr) {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    // ---------- START ----------
    document.addEventListener('DOMContentLoaded', init);
})();
