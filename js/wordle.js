// ====== SICUREZZA: Nessun segreto, API key, token o password nel codice ======

const WORDS = [
    'TAVOLA', 'TORTA', 'BANANA', 'ARANCIA', 'FRAGOLA', 'LIMONE', 'MELE', 'PERA',
    'CASA', 'PIRLA', 'GATTO', 'CIBO', 'SOLE', 'LUNA', 'STELLA', 'FIORE', 'ALBERO',
    'LIBRO', 'ACQUA', 'FUOCO', 'VENTO', 'PIANTA', 'ANIMALE', 'COLORE', 'MUSICA',
    'DANZA', 'CAVALLO', 'FARFALLA', 'MONTAGNA', 'FIUME', 'MARE', 'CIELO', 'NUVOLA',
    'PIOGGIA', 'NEVE', 'TEMPESTA', 'ARCOBALENO', 'FINESTRA', 'PORTA', 'TAVOLO', 'SEDIA',
    'COMPUTER', 'TELEFONO', 'TELEVISORE', 'RADIO', 'GIORNALE', 'MATITA', 'CARTA', 'PENNA',
    'SCUOLA', 'CASTELLO', 'PONTE', 'STRADA', 'STAZIONE', 'TRENO', 'MACCHINA', 'BICICLETTA',
    'AEREO', 'NAVE', 'BARCO', 'ZATTERA', 'PALLONE', 'PALLONE', 'CALCIO', 'TENNIS',
    'BASKET', 'NUOTO', 'CORSA', 'SALTO', 'CICLISMO', 'KAYAK', 'VELA', 'CANOA'
];

let secretWord = '';
let attempts = 6;
let guesses = [];
let gameOver = false;

/**
 * Sanitizza input utente: normalizza, rimuove caratteri non validi, limita lunghezza
 * Protegge da XSS (iniezione di script)
 */
function sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    
    // Normalizza a maiuscole, rimuove spazi, limita a 7 caratteri
    return input
        .toUpperCase()
        .trim()
        .slice(0, 7)
        .replace(/[^A-ZÀÈÉÌÒÙ]/g, ''); // Solo lettere italiane
}

/**
 * Inizializza una nuova partita
 */
function initGame() {
    secretWord = WORDS[Math.floor(Math.random() * WORDS.length)]; 
    attempts = 6;
    guesses = [];
    gameOver = false;
    
    // Reset UI
    const input = document.getElementById('guessInput');
    if (input) input.value = '';
    
    const messageEl = document.getElementById('message');
    if (messageEl) {
        messageEl.textContent = '';
        messageEl.className = 'message';
    }
    
    const attemptsEl = document.getElementById('attempts');
    if (attemptsEl) attemptsEl.textContent = attempts;
    
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) submitBtn.disabled = false;
    
    drawBoard();
    
    // Focus sull'input per miglior UX
    if (input) input.focus();
}

/**
 * Disegna la griglia del gioco
 * Logica corretta per gestire lettere ripetute
 * Conta le occorrenze disponibili per ogni lettera
 */
function drawBoard() {
    const board = document.getElementById('gameBoard');
    if (!board) return;
    
    board.innerHTML = '';

    for (let i = 0; i < 6; i++) {
        const row = document.createElement('div');
        row.className = 'row';

        const wordLength = secretWord.length;
        const rowColors = [];
        
        // Per ogni riga indovinata, calcola i colori correttamente
        if (i < guesses.length) {
            const guess = guesses[i];
            
            // PRIMO PASS: marcca tutte le lettere corrette (VERDE)
            const guessLetterCount = {};
            const secretLetterCount = {};
            
            // Conta le lettere nella parola segreta
            for (let k = 0; k < wordLength; k++) {
                const letter = secretWord[k];
                secretLetterCount[letter] = (secretLetterCount[letter] || 0) + 1;
            }
            
            // Identifica le posizioni corrette
            for (let j = 0; j < wordLength; j++) {
                if (guess[j] === secretWord[j]) {
                    rowColors[j] = 'correct';
                    // Decrementa il conteggio disponibile per questa lettera
                    secretLetterCount[guess[j]]--;
                } else {
                    rowColors[j] = null; // da decidere dopo
                }
            }
            
            // SECONDO PASS: marcca le lettere presenti (ARANCIO)
            for (let j = 0; j < wordLength; j++) {
                if (rowColors[j] === null) { // non è corretta
                    if (secretLetterCount[guess[j]] > 0) {
                        // La lettera è nella parola e rimane disponibile
                        rowColors[j] = 'present';
                        // Decrementa il conteggio disponibile
                        secretLetterCount[guess[j]]--;
                    } else {
                        // La lettera non è disponibile
                        rowColors[j] = 'absent';
                    }
                }
            }
        }
        
        // Disegna i box
        for (let j = 0; j < wordLength; j++) {
            const box = document.createElement('div');
            box.className = 'letter-box';

            if (i < guesses.length) {
                const letter = guesses[i][j];
                box.textContent = letter;

                const color = rowColors[j];
                if (color === 'correct') {
                    box.classList.add('correct');
                    box.setAttribute('aria-label', `${letter} - Posizione corretta`);
                } else if (color === 'present') {
                    box.classList.add('present');
                    box.setAttribute('aria-label', `${letter} - Nella parola`);
                } else {
                    box.classList.add('absent');
                    box.setAttribute('aria-label', `${letter} - Non nella parola`);
                }
            } else {
                // Quadratino vuoto per righe non ancora usate
                box.setAttribute('aria-label', `Quadratino vuoto`);
            }

            row.appendChild(box);
        }

        board.appendChild(row);
    }
}

/**
 * Valida l'indovinazione
 */
function checkGuess(guess) {
    // Validazione della lunghezza
    if (guess.length !== secretWord.length) {
        showMessage(`La parola deve avere ${secretWord.length} lettere!`, 'error');
        return false;
    }

    // Validazione: solo lettere italiane
    if (!/^[A-ZÀÈÉÌÒÙ]+$/.test(guess)) {
        showMessage('Usa solo lettere!', 'error');
        return false;
    }

    guesses.push(guess);
    attempts--;
    return true;
}

/**
 * Mostra un messaggio: usa textContent per evitare XSS
 */
function showMessage(text, type) {
    const messageEl = document.getElementById('message');
    if (!messageEl) return;
    
    // SICUREZZA: textContent al posto di innerHTML per evitare XSS
    messageEl.textContent = text;
    messageEl.className = `message ${type}`;
}

/**
 * Gestisce l'invio dell'indovinazione
 */
function submitGuess() {
    if (gameOver) return;

    const input = document.getElementById('guessInput');
    if (!input) return;
    
    const guess = sanitizeInput(input.value); // Sanitizza input

    if (!guess) {
        showMessage('Inserisci una parola!', 'error');
        return;
    }

    if (!checkGuess(guess)) {
        return;
    }

    input.value = '';
    drawBoard();

    if (guess === secretWord) {
        showMessage(`🎉 Hai vinto! La parola era: ${secretWord}`, 'success');
        gameOver = true;
        const submitBtn = document.getElementById('submitBtn');
        if (submitBtn) submitBtn.disabled = true;
    } else if (attempts === 0) {
        showMessage(`😢 Game Over! La parola era: ${secretWord}`, 'error');
        gameOver = true;
        const submitBtn = document.getElementById('submitBtn');
        if (submitBtn) submitBtn.disabled = true;
    } else {
        const attemptsEl = document.getElementById('attempts');
        if (attemptsEl) attemptsEl.textContent = attempts;
    }
}

/**
 * Inizializza i listener quando il DOM è carico
 */
document.addEventListener('DOMContentLoaded', function() {
    // Listener per bottone Submit
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
        submitBtn.addEventListener('click', submitGuess);
    }

    // Listener per tastiera (Enter key)
    const guessInput = document.getElementById('guessInput');
    if (guessInput) {
        guessInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                submitGuess();
            }
        });
    }

    // Listener per bottone Reset
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', initGame);
    }

    // Inizializza il gioco
    initGame();
});
