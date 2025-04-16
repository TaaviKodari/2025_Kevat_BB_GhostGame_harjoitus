const BOARD_SIZE = 20;
const cellSize = calculateCellSize();
let board;
let player;
let ghosts = [];
let ghostSpeed = 1000;
let isGameRunning = false;
let ghostInterval;
let  score = 0;

document.getElementById('new-game-btn').addEventListener('click',startGame);

document.addEventListener('keydown',(event)=>{
    if(!isGameRunning)
    {
        return;
    }
    switch(event.key){
        case 'ArrowUp':
            player.move(0,-1);
        break;
        case 'ArrowDown':
            player.move(0,1);
        break;
        case 'ArrowLeft':
            player.move(-1,0);    
        break;
        case 'ArrowRight':
            player.move(1,0);    
        break;

        case 'w':
            shootAt(player.x, player.y - 1);
            break;
        case 's':
            shootAt(player.x,player.y + 1);
            break;
        case 'a':
            shootAt(player.x - 1 ,player.y);
            break;
        case 'd':
            shootAt(player.x  + 1, player.y);
            break;
    }
    event.preventDefault(); //estää scrollauksen nettisivulla
});

function startGame(){
    document.getElementById('intro-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'block';

    score = 0;
    updateScoreBoard(0);
    player = new Player(0,0);
    board = generateRandomBoard();
    drawBoard(board);
    
    isGameRunning = true;
    setTimeout(()=>{
        ghostInterval =  setInterval(moveGhosts,ghostSpeed);
    },1000);
}

function generateRandomBoard(){
    const newBoard = Array.from({length: BOARD_SIZE},()=> Array(BOARD_SIZE).fill(''));
    
    for(let y=0; y < BOARD_SIZE; y++){
        for(let x = 0; x < BOARD_SIZE; x++){
            if(y === 0 || y === BOARD_SIZE -1 || x === 0 || x === BOARD_SIZE -1){
                newBoard[y][x] = 'W';
            }
        }
    }

    console.log(newBoard);
    generateObstacles(newBoard);
    //newBoard[6][7] = 'P' //P is player
    const[playerX,playerY] = randomEmptyPosition(newBoard);
    setCell(newBoard,playerX,playerY,'P');
    player.x = playerX;
    player.y = playerY;
    ghosts = [];

    for(let i = 0; i < 5; i++){
        const[ghostX, ghostY] = randomEmptyPosition(newBoard);
        setCell(newBoard,ghostX,ghostY,'H');
        ghosts.push(new Ghost(ghostX,ghostY));
    }
    
    return newBoard;
}

function drawBoard(board){
    const gameBoard = document.getElementById('game-board');
    gameBoard.style.gridTemplateColumns = `repeat(${BOARD_SIZE},1fr)`;
    gameBoard.innerHTML = "";
    for(let y = 0; y < BOARD_SIZE; y++){
        for(let x = 0; x < BOARD_SIZE; x++){
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.style.width = cellSize + "px";
            cell.style.height = cellSize + "px";
            let value = getCell(board, x,y);
            if(value === 'W'){
                cell.classList.add('wall');
            }
            else if(value === 'P'){
                cell.classList.add('player');
            }else if(value === 'H'){
                cell.classList.add('hornmonster');
            }else if (value == 'B'){
                cell.classList.add('bullet');
                setTimeout(()=>{
                    setCell(board,x,y,'');
                    drawBoard(board);
                }, 500);
            }
            gameBoard.appendChild(cell);
        }
    }
    
}

function getCell(board,x,y){
    return board[y][x];
}

function calculateCellSize(){
    const screenSize = Math.min(window.innerWidth,window.innerHeight);
    const gameBoardSize = 0.95 * screenSize;
    return gameBoardSize / BOARD_SIZE;
}

function generateObstacles(board){
    const obstacles =[
        [[0,0],[0,1],[1,0],[1,1]], //Square
        [[0,0],[0,1],[0,2],[0,3]], // I
        [[0,0],[1,0],[2,0],[1,1]], //T
        //Lisää loput kun olet testannut, että nämä toimivat
    ];

    const positions =[
        {startX: 2, startY:2},
        {startX: 8, startY:2},
        {startX: 4, startY: 8}
    ];

    positions.forEach(pos=>{
        const randomObstacle = obstacles[Math.floor(Math.random()*obstacles.length)];
        placeObstacle(board,randomObstacle,pos.startX,pos.startY);
    })
    
}

function placeObstacle(board, obstacle, startX,startY){
    for(coordinatePair of obstacle){
        [x,y] = coordinatePair;
        board[startY + y][startX + x] = "W";
    }
}

function randomInt(min,max){
    return Math.floor(Math.random() * (max-min +1))+min;
}

function randomEmptyPosition(board){
   let x = randomInt(1,BOARD_SIZE -2);
   let y = randomInt(1,BOARD_SIZE -2);
    if(getCell(board, x,y)===''){
        return [x,y];
    }else{
        return randomEmptyPosition(board);
    }
}

function setCell(board, x,y,value){
    board[y][x] = value;
}

function shootAt(x,y){
    if(getCell(board,x,y)=== 'W'){
        return;
    }
    const  ghostIndex = ghosts.findIndex(ghost => ghost.x === x && ghost.y === y);

    if(ghostIndex !== -1){    
        ghosts.splice(ghostIndex,1);
        updateScoreBoard(50);
    }
    
    setCell(board,x,y,'B');
    drawBoard(board);

    if(ghosts.length === 0){
        startNextLevel();
    }

}

function moveGhosts(){
    const oldGhosts = ghosts.map(ghost =>({x:ghost.x, y: ghost.y}));

    ghosts.forEach(ghost =>{
        const newPosition = ghost.moveGhostTowardsPlayer(player,board, oldGhosts);
        ghost.x = newPosition.x;
        ghost.y = newPosition.y;
        setCell(board,ghost.x, ghost.y, 'H');

        oldGhosts.forEach(ghost =>{
            setCell(board, ghost.x, ghost.y, ''); 
        });

        ghosts.forEach(ghost =>{
            setCell(board, ghost.x, ghost.y,'H');
            if(ghost.x === player.x && ghost.y === player.y){
                endGame();  
            }
        });
        drawBoard(board);
    })

}

function endGame(){
    isGameRunning = false;
    clearInterval(ghostInterval); 
    alert('Game Over! THe ghost caught you!');
    document.getElementById('intro-screen').style.display = 'block';
    document.getElementById('game-screen').style.display = 'none';
}

function updateScoreBoard(points){
    const  scoreBoard = document.getElementById('score-board');
    score += points;
    scoreBoard.textContent = `Pisteet: ${score}`;
}

function startNextLevel(){
    alert('Level Up! Haamujen nopeus kasvaa.')
    board = generateRandomBoard();
    drawBoard(board);
    ghostSpeed = ghostSpeed * 0.9;
    clearInterval(ghostInterval);
    setTimeout(()=>{
        ghostInterval = setInterval(moveGhosts,ghostSpeed)
    }, 1000);
}

class Player{
    constructor(x,y){
        this.x = x;
        this.y = y;
    }
    move(deltaX, deltaY){
        const currentX = player.x;
        const currentY = player.y;

        const newX = currentX + deltaX;
        const newY = currentY + deltaY;
        player.x = newX;
        player.y = newY;
        board[currentY][currentX] = '';
        board[newY][newX] = 'P';

        drawBoard(board);
    }
}

class Ghost{
    constructor(x,y){
        this.x = x;
        this.y = y;
    }
    moveGhostTowardsPlayer(player,board, oldGhosts){
        let dx = player.x - this.x;
        let dy = player.y - this.y;

        let moves = [];
        
        if(Math.abs(dx)>Math.abs(dy)){
            if(dx > 0 ) moves.push({x: this.x +1, y:this.y});
            else moves.push({x: this.x -1, y: this.y});
            
            if(dy > 0) moves.push({x:this.x, y:this.y +1});
            else moves.push({x:this.x, y: this.y -1})
        }
        else{
            if(dy > 0) moves.push({x:this.x, y:this.y +1});
            else moves.push({x:this.x, y: this.y -1})
        
            if(dx > 0 ) moves.push({x: this.x +1, y:this.y});
            else moves.push({x: this.x -1, y: this.y});
        }

        for(let move of moves){
          const value = getCell(board,move.x, move.y);
            console.log(value);
            if( value === '' || value == 'P' &&
                 !oldGhosts.some(h => h.x === move.x && h.y === move.y)){
                return move;
            }
        }

        return {x: this.x, y:this.y};
    }
}