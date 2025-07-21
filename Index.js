document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const levelEl = document.getElementById('level');
    const scoreEl = document.getElementById('score');
    const colorPaletteEl = document.getElementById('color-palette');
    const restartBtn = document.getElementById('restart-btn');
    const settingsBtn = document.getElementById('settings-btn');
    const nextLevelBtn = document.getElementById('next-level-btn');
    const winModal = document.getElementById('win-modal');
    const settingsModal = document.getElementById('settings-modal');
    const closeModalBtns = document.querySelectorAll('.close-btn');
    const applySettingsBtn = document.getElementById('apply-settings-btn');

    // --- Game State ---
    let gameState = {
        level: 1,
        score: 0,
        bottles: [],
        selectedColor: null,
        levelConfig: [
            { bottles: 2, colors: 2 },
            { bottles: 3, colors: 3 },
            { bottles: 4, colors: 3 },
            { bottles: 4, colors: 4 },
            { bottles: 5, colors: 4 },
        ]
    };

    const BOTTLE_WIDTH = 60;
    const BOTTLE_HEIGHT = 150;
    const COLOR_LAYERS = 4;
    const LAYER_HEIGHT = BOTTLE_HEIGHT / COLOR_LAYERS;

    // --- Game Logic ---

    function setupLevel(level) {
        const config = gameState.levelConfig[level - 1] || gameState.levelConfig[gameState.levelConfig.length - 1];
        const numBottles = config.bottles;
        const numColors = config.colors;
        
        gameState.bottles = [];
        gameState.selectedColor = null;

        // Generate colors
        const availableColors = generateUniqueColors(numColors);
        const colorDistribution = [...availableColors, ...availableColors, ...availableColors, ...availableColors].slice(0, numBottles * COLOR_LAYERS);
        shuffleArray(colorDistribution);
        
        // Create bottles
        for (let i = 0; i < numBottles; i++) {
            gameState.bottles.push({
                x: 0, // Will be set in draw
                y: 0, // Will be set in draw
                colors: colorDistribution.splice(0, COLOR_LAYERS)
            });
        }
        
        // Add empty bottles
        gameState.bottles.push({ x: 0, y: 0, colors: [] });
        if(numBottles > 3) gameState.bottles.push({ x: 0, y: 0, colors: [] });


        updateUI();
        setupColorPalette(availableColors);
        draw();
    }
    
    function draw() {
        // Responsive canvas sizing
        const containerWidth = canvas.parentElement.clientWidth;
        canvas.width = containerWidth;
        const bottleSpacing = (canvas.width - gameState.bottles.length * BOTTLE_WIDTH) / (gameState.bottles.length + 1);
        canvas.height = BOTTLE_HEIGHT + 40;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        gameState.bottles.forEach((bottle, index) => {
            const x = bottleSpacing + index * (BOTTLE_WIDTH + bottleSpacing);
            const y = 20;
            bottle.x = x;
            bottle.y = y;

            drawBottle(bottle);
        });
    }

    function drawBottle(bottle) {
        // Draw bottle shape
        ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--bottle-stroke');
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(bottle.x, bottle.y + BOTTLE_HEIGHT);
        ctx.lineTo(bottle.x, bottle.y + 20);
        ctx.quadraticCurveTo(bottle.x, bottle.y, bottle.x + BOTTLE_WIDTH / 2, bottle.y);
        ctx.quadraticCurveTo(bottle.x + BOTTLE_WIDTH, bottle.y, bottle.x + BOTTLE_WIDTH, bottle.y + 20);
        ctx.lineTo(bottle.x + BOTTLE_WIDTH, bottle.y + BOTTLE_HEIGHT);
        ctx.closePath();
        ctx.stroke();

        // Draw colors inside
        bottle.colors.forEach((color, i) => {
            ctx.fillStyle = color;
            const layerY = bottle.y + BOTTLE_HEIGHT - (i + 1) * LAYER_HEIGHT;
            ctx.fillRect(bottle.x + ctx.lineWidth / 2, layerY, BOTTLE_WIDTH - ctx.lineWidth, LAYER_HEIGHT);
        });
    }

    function handleCanvasClick(event) {
        if (!gameState.selectedColor) return;

        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const clickedBottle = gameState.bottles.find(bottle => 
            x >= bottle.x && x <= bottle.x + BOTTLE_WIDTH &&
            y >= bottle.y && y <= bottle.y + BOTTLE_HEIGHT
        );

        if (clickedBottle && clickedBottle.colors.length < COLOR_LAYERS) {
            clickedBottle.colors.push(gameState.selectedColor);
            gameState.score += 10;
            updateUI();
            draw();
            checkWinCondition();
            
            // Auto-deselect color after use
            deselectColors();
            gameState.selectedColor = null;
        }
    }
    
    function checkWinCondition() {
        const filledBottles = gameState.bottles.filter(b => b.colors.length > 0);
        const isWin = filledBottles.every(bottle => 
            bottle.colors.length === COLOR_LAYERS && new Set(bottle.colors).size === 1
        );

        if (isWin) {
            document.getElementById('final-score').textContent = gameState.score;
            winModal.style.display = 'flex';
        }
    }

    function updateUI() {
        levelEl.textContent = gameState.level;
        scoreEl.textContent = gameState.score;
    }
    
    function setupColorPalette(colors) {
        colorPaletteEl.innerHTML = '';
        colors.forEach(color => {
            const colorDiv = document.createElement('div');
            colorDiv.className = 'color-option';
            colorDiv.style.backgroundColor = color;
            colorDiv.dataset.color = color;
            colorDiv.addEventListener('click', () => {
                deselectColors();
                colorDiv.classList.add('selected');
                gameState.selectedColor = color;
            });
            colorPaletteEl.appendChild(colorDiv);
        });
    }

    function deselectColors() {
        document.querySelectorAll('.color-option').forEach(el => el.classList.remove('selected'));
    }
    
    // --- Utility Functions ---
    
    function generateUniqueColors(count) {
        const colors = ["#FF5733", "#33FF57", "#3357FF", "#FF33A1", "#A133FF", "#33FFA1", "#FFC300", "#C70039"];
        shuffleArray(colors);
        return colors.slice(0, count);
    }
    
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    // --- Event Listeners ---
    
    canvas.addEventListener('click', handleCanvasClick);
    restartBtn.addEventListener('click', () => setupLevel(gameState.level));
    
    nextLevelBtn.addEventListener('click', () => {
        gameState.level++;
        winModal.style.display = 'none';
        setupLevel(gameState.level);
    });

    settingsBtn.addEventListener('click', () => settingsModal.style.display = 'flex');
    closeModalBtns.forEach(btn => btn.addEventListener('click', () => {
        settingsModal.style.display = 'none';
        winModal.style.display = 'none';
    }));
    
    window.addEventListener('click', (event) => {
        if (event.target === settingsModal) settingsModal.style.display = 'none';
        if (event.target === winModal) winModal.style.display = 'none';
    });

    applySettingsBtn.addEventListener('click', () => {
        const newName = document.getElementById('game-name-input').value;
        const newBgColor = document.getElementById('bg-color-input').value;
        const newBtnColor = document.getElementById('btn-color-input').value;

        if (newName) {
            document.getElementById('game-title').textContent = newName;
        }
        
        document.documentElement.style.setProperty('--bg-color', newBgColor);
        document.documentElement.style.setProperty('--btn-color', newBtnColor);
        
        settingsModal.style.display = 'none';
    });

    window.addEventListener('resize', draw);

    // --- Initial Setup ---
    setupLevel(gameState.level);
});
      
