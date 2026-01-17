import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

// Типы фигур
type PieceType = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn' | 'mage' | 'dragon' | 'necromancer' | 'archangel' | 'warlock';
type PieceColor = 'white' | 'black';

interface Piece {
  type: PieceType;
  color: PieceColor;
  hasMoved?: boolean;
  canTeleport?: boolean;
  canFly?: boolean;
  canRevive?: boolean;
  reviveCount?: number;
}

interface Position {
  row: number;
  col: number;
}

interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress?: number;
  requirement?: number;
}

// Эмодзи для фигур
const pieceEmojis: Record<PieceType, { white: string; black: string }> = {
  king: { white: '♔', black: '♚' },
  queen: { white: '♕', black: '♛' },
  rook: { white: '♖', black: '♜' },
  bishop: { white: '♗', black: '♝' },
  knight: { white: '♘', black: '♞' },
  pawn: { white: '♙', black: '♟' },
  mage: { white: '🧙‍♂️', black: '🧙‍♀️' },
  dragon: { white: '🐲', black: '🐉' },
  necromancer: { white: '☠️', black: '💀' },
  archangel: { white: '👼', black: '😈' },
  warlock: { white: '🔮', black: '🌑' },
};

const Index = () => {
  const [gameStarted, setGameStarted] = useState(false);
  const [showModeDialog, setShowModeDialog] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [gameMode, setGameMode] = useState<'local' | 'bot' | 'online'>('local');
  const [botDifficulty, setBotDifficulty] = useState(1);
  const [board, setBoard] = useState<(Piece | null)[][]>([]);
  const [selectedPos, setSelectedPos] = useState<Position | null>(null);
  const [currentTurn, setCurrentTurn] = useState<PieceColor>('white');
  const [captures, setCaptures] = useState<{ white: Piece[]; black: Piece[] }>({ white: [], black: [] });
  
  // Профиль игрока
  const [playerStats, setPlayerStats] = useState({
    username: 'Игрок',
    rating: 1200,
    totalGames: 0,
    wins: 0,
    losses: 0,
    draws: 0,
  });

  // Достижения
  const [achievements, setAchievements] = useState<Achievement[]>([
    { id: 1, name: 'Первая победа', description: 'Одержите первую победу', icon: '🏆', unlocked: false, progress: 0, requirement: 1 },
    { id: 2, name: 'Покоритель новичков', description: 'Победите бота 1-3 уровня 10 раз', icon: '🎯', unlocked: false, progress: 0, requirement: 10 },
    { id: 3, name: 'Стратег', description: 'Победите бота 4-7 уровня 5 раз', icon: '🧠', unlocked: false, progress: 0, requirement: 5 },
    { id: 4, name: 'Гроссмейстер', description: 'Победите бота 8-10 уровня 3 раза', icon: '👑', unlocked: false, progress: 0, requirement: 3 },
    { id: 5, name: 'Серия побед', description: 'Выиграйте 5 игр подряд', icon: '🔥', unlocked: false, progress: 0, requirement: 5 },
    { id: 6, name: 'Мастер телепортации', description: 'Используйте телепортацию Мага 50 раз', icon: '✨', unlocked: false, progress: 0, requirement: 50 },
    { id: 7, name: 'Драконий всадник', description: 'Выиграйте 10 игр с Драконом', icon: '🐉', unlocked: false, progress: 0, requirement: 10 },
    { id: 8, name: 'Некромант', description: 'Воскресите 25 фигур', icon: '💀', unlocked: false, progress: 0, requirement: 25 },
    { id: 9, name: 'Марафонец', description: 'Сыграйте 100 партий', icon: '🎮', unlocked: false, progress: 0, requirement: 100 },
    { id: 10, name: 'Легенда', description: 'Достигните рейтинга 2000', icon: '⭐', unlocked: false, progress: 1200, requirement: 2000 },
  ]);

  // Инициализация доски 16x16
  const initializeBoard = () => {
    const newBoard: (Piece | null)[][] = Array(16).fill(null).map(() => Array(16).fill(null));
    
    // Белые фигуры (нижние 2 ряда)
    // Первый ряд - основные фигуры
    newBoard[15][0] = { type: 'rook', color: 'white' };
    newBoard[15][1] = { type: 'knight', color: 'white' };
    newBoard[15][2] = { type: 'bishop', color: 'white' };
    newBoard[15][3] = { type: 'necromancer', color: 'white', canRevive: true, reviveCount: 0 };
    newBoard[15][4] = { type: 'dragon', color: 'white', canFly: true };
    newBoard[15][5] = { type: 'mage', color: 'white', canTeleport: true };
    newBoard[15][6] = { type: 'queen', color: 'white' };
    newBoard[15][7] = { type: 'king', color: 'white' };
    newBoard[15][8] = { type: 'archangel', color: 'white' };
    newBoard[15][9] = { type: 'warlock', color: 'white' };
    newBoard[15][10] = { type: 'mage', color: 'white', canTeleport: true };
    newBoard[15][11] = { type: 'dragon', color: 'white', canFly: true };
    newBoard[15][12] = { type: 'necromancer', color: 'white', canRevive: true, reviveCount: 0 };
    newBoard[15][13] = { type: 'bishop', color: 'white' };
    newBoard[15][14] = { type: 'knight', color: 'white' };
    newBoard[15][15] = { type: 'rook', color: 'white' };
    
    // Пешки
    for (let col = 0; col < 16; col++) {
      newBoard[14][col] = { type: 'pawn', color: 'white' };
    }

    // Чёрные фигуры (верхние 2 ряда)
    newBoard[0][0] = { type: 'rook', color: 'black' };
    newBoard[0][1] = { type: 'knight', color: 'black' };
    newBoard[0][2] = { type: 'bishop', color: 'black' };
    newBoard[0][3] = { type: 'necromancer', color: 'black', canRevive: true, reviveCount: 0 };
    newBoard[0][4] = { type: 'dragon', color: 'black', canFly: true };
    newBoard[0][5] = { type: 'mage', color: 'black', canTeleport: true };
    newBoard[0][6] = { type: 'queen', color: 'black' };
    newBoard[0][7] = { type: 'king', color: 'black' };
    newBoard[0][8] = { type: 'archangel', color: 'black' };
    newBoard[0][9] = { type: 'warlock', color: 'black' };
    newBoard[0][10] = { type: 'mage', color: 'black', canTeleport: true };
    newBoard[0][11] = { type: 'dragon', color: 'black', canFly: true };
    newBoard[0][12] = { type: 'necromancer', color: 'black', canRevive: true, reviveCount: 0 };
    newBoard[0][13] = { type: 'bishop', color: 'black' };
    newBoard[0][14] = { type: 'knight', color: 'black' };
    newBoard[0][15] = { type: 'rook', color: 'black' };
    
    for (let col = 0; col < 16; col++) {
      newBoard[1][col] = { type: 'pawn', color: 'black' };
    }

    setBoard(newBoard);
  };

  useEffect(() => {
    if (gameStarted && board.length === 0) {
      initializeBoard();
    }
  }, [gameStarted]);

  // Проверка возможности хода
  const isValidMove = (from: Position, to: Position): boolean => {
    const piece = board[from.row][from.col];
    if (!piece || piece.color !== currentTurn) return false;

    const targetPiece = board[to.row][to.col];
    if (targetPiece && targetPiece.color === piece.color) return false;

    const rowDiff = Math.abs(to.row - from.row);
    const colDiff = Math.abs(to.col - from.col);

    switch (piece.type) {
      case 'pawn':
        const direction = piece.color === 'white' ? -1 : 1;
        const startRow = piece.color === 'white' ? 14 : 1;
        if (to.col === from.col && !targetPiece) {
          if (to.row === from.row + direction) return true;
          if (from.row === startRow && to.row === from.row + 2 * direction) return true;
        }
        if (Math.abs(to.col - from.col) === 1 && to.row === from.row + direction && targetPiece) return true;
        return false;

      case 'rook':
        return (to.row === from.row || to.col === from.col) && isPathClear(from, to);

      case 'bishop':
        return rowDiff === colDiff && isPathClear(from, to);

      case 'knight':
        return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);

      case 'queen':
        return ((to.row === from.row || to.col === from.col) || (rowDiff === colDiff)) && isPathClear(from, to);

      case 'king':
        return rowDiff <= 1 && colDiff <= 1;

      case 'mage':
        // Маг: как слон + телепортация (может прыгнуть на любую клетку в радиусе 3)
        if (rowDiff === colDiff && isPathClear(from, to)) return true;
        if (piece.canTeleport && rowDiff <= 3 && colDiff <= 3) {
          toast.success('Маг использует телепортацию! ✨');
          return true;
        }
        return false;

      case 'dragon':
        // Дракон: как ферзь + может перепрыгивать через фигуры
        if ((to.row === from.row || to.col === from.col) || (rowDiff === colDiff)) return true;
        return false;

      case 'necromancer':
        // Некромант: как слон, может воскрешать фигуры
        return rowDiff === colDiff && isPathClear(from, to);

      case 'archangel':
        // Архангел: как ферзь + может лечить союзников (защита от взятия на 1 ход)
        return ((to.row === from.row || to.col === from.col) || (rowDiff === colDiff)) && isPathClear(from, to);

      case 'warlock':
        // Чернокнижник: как ладья + может проклинать врагов (блокировка хода)
        return (to.row === from.row || to.col === from.col) && isPathClear(from, to);

      default:
        return false;
    }
  };

  const isPathClear = (from: Position, to: Position): boolean => {
    const rowStep = to.row > from.row ? 1 : to.row < from.row ? -1 : 0;
    const colStep = to.col > from.col ? 1 : to.col < from.col ? -1 : 0;

    let row = from.row + rowStep;
    let col = from.col + colStep;

    while (row !== to.row || col !== to.col) {
      if (board[row][col] !== null) return false;
      row += rowStep;
      col += colStep;
    }

    return true;
  };

  const handleSquareClick = (row: number, col: number) => {
    if (!selectedPos) {
      const piece = board[row][col];
      if (piece && piece.color === currentTurn) {
        setSelectedPos({ row, col });
      }
    } else {
      if (isValidMove(selectedPos, { row, col })) {
        makeMove(selectedPos, { row, col });
      }
      setSelectedPos(null);
    }
  };

  const makeMove = (from: Position, to: Position) => {
    const newBoard = board.map(row => [...row]);
    const piece = newBoard[from.row][from.col];
    const capturedPiece = newBoard[to.row][to.col];

    if (capturedPiece) {
      setCaptures(prev => ({
        ...prev,
        [currentTurn]: [...prev[currentTurn], capturedPiece],
      }));
      
      toast.info(`${pieceEmojis[piece!.type][currentTurn]} взял ${pieceEmojis[capturedPiece.type][capturedPiece.color]}!`);
    }

    newBoard[to.row][to.col] = piece;
    newBoard[from.row][from.col] = null;
    
    if (piece) piece.hasMoved = true;

    setBoard(newBoard);
    setCurrentTurn(currentTurn === 'white' ? 'black' : 'white');

    // Ход бота
    if (gameMode === 'bot' && currentTurn === 'white') {
      setTimeout(() => makeBotMove(newBoard), 500);
    }
  };

  const makeBotMove = (currentBoard: (Piece | null)[][]) => {
    const botPieces: Position[] = [];
    currentBoard.forEach((row, rowIdx) => {
      row.forEach((piece, colIdx) => {
        if (piece && piece.color === 'black') {
          botPieces.push({ row: rowIdx, col: colIdx });
        }
      });
    });

    // Простая логика бота - случайный ход
    const attempts = botPieces.length * 20;
    for (let i = 0; i < attempts; i++) {
      const fromPos = botPieces[Math.floor(Math.random() * botPieces.length)];
      const toRow = Math.floor(Math.random() * 16);
      const toCol = Math.floor(Math.random() * 16);
      
      if (isValidMove(fromPos, { row: toRow, col: toCol })) {
        setSelectedPos(fromPos);
        setTimeout(() => {
          makeMove(fromPos, { row: toRow, col: toCol });
        }, 300);
        return;
      }
    }
  };

  const startGame = (mode: 'local' | 'bot' | 'online', difficulty?: number) => {
    setGameMode(mode);
    if (difficulty) setBotDifficulty(difficulty);
    setGameStarted(true);
    setShowModeDialog(false);
    initializeBoard();
    toast.success(`Игра начата! Режим: ${mode === 'local' ? 'Локально' : mode === 'bot' ? `Бот (уровень ${difficulty})` : 'Онлайн'}`);
  };

  const unlockAchievement = (achievementId: number) => {
    setAchievements(prev =>
      prev.map(ach =>
        ach.id === achievementId ? { ...ach, unlocked: true } : ach
      )
    );
    const achievement = achievements.find(a => a.id === achievementId);
    if (achievement) {
      toast.success(`🏆 Достижение разблокировано: ${achievement.name}!`, {
        description: achievement.description,
      });
    }
  };

  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1A1F2C] via-[#2D1B4E] to-[#1A1F2C] flex items-center justify-center p-4">
        <div className="text-center space-y-8 animate-fade-in">
          <div className="space-y-4">
            <h1 className="text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#9b87f5] via-[#D6BCFA] to-[#F97316] animate-pulse">
              ⚔️ MAGICAL CHESS ⚔️
            </h1>
            <p className="text-xl text-[#D6BCFA]">Фантастические шахматы 16×16 с магическими фигурами</p>
          </div>

          <div className="space-y-4">
            <Button
              size="lg"
              onClick={() => setShowModeDialog(true)}
              className="bg-gradient-to-r from-[#9b87f5] to-[#7E69AB] hover:from-[#8B5CF6] hover:to-[#6E59A5] text-white text-xl px-12 py-6 rounded-xl shadow-2xl hover:scale-105 transition-transform"
            >
              <Icon name="Play" className="mr-2" size={28} />
              НАЧАТЬ ИГРУ
            </Button>

            <div className="flex gap-4 justify-center">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setShowProfileDialog(true)}
                className="border-[#9b87f5] text-[#D6BCFA] hover:bg-[#9b87f5]/20"
              >
                <Icon name="User" className="mr-2" size={20} />
                Профиль
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => setShowSettingsDialog(true)}
                className="border-[#9b87f5] text-[#D6BCFA] hover:bg-[#9b87f5]/20"
              >
                <Icon name="Settings" className="mr-2" size={20} />
                Настройки
              </Button>
            </div>
          </div>

          <div className="bg-[#1A1F2C]/50 backdrop-blur-sm p-6 rounded-2xl border border-[#9b87f5]/30 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-[#D6BCFA] mb-4">🧙 Магические фигуры:</h3>
            <div className="grid grid-cols-2 gap-3 text-left text-[#D6BCFA]">
              <div>✨ <strong>Маг</strong> - телепортация</div>
              <div>🐉 <strong>Дракон</strong> - полёт через фигуры</div>
              <div>💀 <strong>Некромант</strong> - воскрешение</div>
              <div>👼 <strong>Архангел</strong> - защита</div>
              <div>🔮 <strong>Чернокнижник</strong> - проклятия</div>
            </div>
          </div>
        </div>

        {/* Диалог выбора режима */}
        <Dialog open={showModeDialog} onOpenChange={setShowModeDialog}>
          <DialogContent className="bg-[#1A1F2C] border-[#9b87f5] text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-3xl text-[#D6BCFA]">Выберите режим игры</DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue="local" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-[#2D1B4E]">
                <TabsTrigger value="local" className="data-[state=active]:bg-[#9b87f5]">
                  <Icon name="Users" className="mr-2" size={18} />
                  Локально
                </TabsTrigger>
                <TabsTrigger value="bot" className="data-[state=active]:bg-[#9b87f5]">
                  <Icon name="Bot" className="mr-2" size={18} />
                  Против бота
                </TabsTrigger>
                <TabsTrigger value="online" className="data-[state=active]:bg-[#9b87f5]">
                  <Icon name="Globe" className="mr-2" size={18} />
                  Онлайн
                </TabsTrigger>
              </TabsList>

              <TabsContent value="local" className="space-y-4">
                <p className="text-[#D6BCFA]">Играйте с другом на одном устройстве</p>
                <Button
                  onClick={() => startGame('local')}
                  className="w-full bg-[#9b87f5] hover:bg-[#8B5CF6]"
                  size="lg"
                >
                  Начать локальную игру
                </Button>
              </TabsContent>

              <TabsContent value="bot" className="space-y-4">
                <p className="text-[#D6BCFA]">Выберите уровень сложности бота (1-10):</p>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(level => (
                    <Button
                      key={level}
                      onClick={() => startGame('bot', level)}
                      variant={botDifficulty === level ? 'default' : 'outline'}
                      className={`${
                        level <= 3
                          ? 'border-green-500 text-green-500'
                          : level <= 7
                          ? 'border-yellow-500 text-yellow-500'
                          : 'border-red-500 text-red-500'
                      }`}
                    >
                      {level}
                    </Button>
                  ))}
                </div>
                <div className="flex gap-2 text-sm text-[#D6BCFA]">
                  <Badge variant="outline" className="border-green-500 text-green-500">1-3: Новичок</Badge>
                  <Badge variant="outline" className="border-yellow-500 text-yellow-500">4-7: Средний</Badge>
                  <Badge variant="outline" className="border-red-500 text-red-500">8-10: Эксперт</Badge>
                </div>
              </TabsContent>

              <TabsContent value="online" className="space-y-4">
                <p className="text-[#D6BCFA]">Играйте с игроками по всему миру</p>
                <Button
                  onClick={() => {
                    toast.info('Онлайн режим скоро будет доступен!');
                    setShowModeDialog(false);
                  }}
                  className="w-full bg-[#9b87f5] hover:bg-[#8B5CF6]"
                  size="lg"
                >
                  Найти соперника
                </Button>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>

        {/* Диалог профиля */}
        <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
          <DialogContent className="bg-[#1A1F2C] border-[#9b87f5] text-white max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-3xl text-[#D6BCFA]">
                <Icon name="User" className="inline mr-2" size={32} />
                Профиль игрока
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Статистика */}
              <Card className="bg-[#2D1B4E]/50 border-[#9b87f5]/30 p-6">
                <h3 className="text-2xl font-bold text-[#D6BCFA] mb-4">{playerStats.username}</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-[#F97316]">{playerStats.rating}</div>
                    <div className="text-sm text-[#D6BCFA]">Рейтинг</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white">{playerStats.totalGames}</div>
                    <div className="text-sm text-[#D6BCFA]">Игр</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-500">{playerStats.wins}</div>
                    <div className="text-sm text-[#D6BCFA]">Побед</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-500">{playerStats.losses}</div>
                    <div className="text-sm text-[#D6BCFA]">Поражений</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-500">{playerStats.draws}</div>
                    <div className="text-sm text-[#D6BCFA]">Ничьих</div>
                  </div>
                </div>
              </Card>

              {/* Достижения */}
              <div>
                <h3 className="text-2xl font-bold text-[#D6BCFA] mb-4">
                  🏆 Достижения ({achievements.filter(a => a.unlocked).length}/{achievements.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {achievements.map(achievement => (
                    <Card
                      key={achievement.id}
                      className={`p-4 ${
                        achievement.unlocked
                          ? 'bg-gradient-to-r from-[#9b87f5]/30 to-[#F97316]/30 border-[#9b87f5]'
                          : 'bg-[#2D1B4E]/30 border-gray-700 opacity-60'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-4xl">{achievement.icon}</div>
                        <div className="flex-1">
                          <h4 className="font-bold text-white">{achievement.name}</h4>
                          <p className="text-sm text-[#D6BCFA]">{achievement.description}</p>
                          {!achievement.unlocked && achievement.progress !== undefined && achievement.requirement && (
                            <div className="mt-2">
                              <Progress
                                value={(achievement.progress / achievement.requirement) * 100}
                                className="h-2"
                              />
                              <p className="text-xs text-[#D6BCFA] mt-1">
                                {achievement.progress} / {achievement.requirement}
                              </p>
                            </div>
                          )}
                        </div>
                        {achievement.unlocked && (
                          <Icon name="CheckCircle" className="text-green-500" size={24} />
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Диалог настроек */}
        <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
          <DialogContent className="bg-[#1A1F2C] border-[#9b87f5] text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl text-[#D6BCFA]">
                <Icon name="Settings" className="inline mr-2" size={28} />
                Настройки
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[#D6BCFA]">Звуковые эффекты</span>
                <Button variant="outline" size="sm">Вкл</Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#D6BCFA]">Графика</span>
                <Button variant="outline" size="sm">Высокая</Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#D6BCFA]">Язык</span>
                <Button variant="outline" size="sm">Русский</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A1F2C] via-[#2D1B4E] to-[#1A1F2C] p-4">
      {/* Верхняя панель */}
      <div className="max-w-7xl mx-auto mb-4 flex justify-between items-center">
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setGameStarted(false);
              setBoard([]);
              setSelectedPos(null);
              setCurrentTurn('white');
            }}
            className="border-[#9b87f5] text-[#D6BCFA] hover:bg-[#9b87f5]/20"
          >
            <Icon name="Home" className="mr-2" size={18} />
            Главная
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowProfileDialog(true)}
            className="border-[#9b87f5] text-[#D6BCFA] hover:bg-[#9b87f5]/20"
          >
            <Icon name="User" className="mr-2" size={18} />
            Профиль
          </Button>
        </div>

        <div className="text-2xl font-bold text-[#D6BCFA]">
          Ход: {currentTurn === 'white' ? '⚪ Белые' : '⚫ Чёрные'}
        </div>

        <Button
          variant="outline"
          onClick={() => setShowSettingsDialog(true)}
          className="border-[#9b87f5] text-[#D6BCFA] hover:bg-[#9b87f5]/20"
        >
          <Icon name="Settings" size={18} />
        </Button>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Захваченные фигуры чёрных */}
        <Card className="bg-[#1A1F2C]/80 border-[#9b87f5]/30 p-4 lg:col-span-1">
          <h3 className="text-lg font-bold text-[#D6BCFA] mb-2">⚫ Захвачено:</h3>
          <div className="flex flex-wrap gap-1">
            {captures.white.map((piece, idx) => (
              <span key={idx} className="text-2xl">
                {pieceEmojis[piece.type][piece.color]}
              </span>
            ))}
          </div>
        </Card>

        {/* Игровая доска */}
        <div className="lg:col-span-2">
          <div
            className="grid gap-0 bg-[#2D1B4E] p-2 rounded-xl border-4 border-[#9b87f5] shadow-2xl"
            style={{
              gridTemplateColumns: 'repeat(16, minmax(0, 1fr))',
              aspectRatio: '1',
            }}
          >
            {board.map((row, rowIdx) =>
              row.map((piece, colIdx) => {
                const isLight = (rowIdx + colIdx) % 2 === 0;
                const isSelected = selectedPos?.row === rowIdx && selectedPos?.col === colIdx;

                return (
                  <div
                    key={`${rowIdx}-${colIdx}`}
                    onClick={() => handleSquareClick(rowIdx, colIdx)}
                    className={`
                      aspect-square flex items-center justify-center cursor-pointer
                      transition-all duration-200 hover:scale-105
                      ${isLight ? 'bg-[#D6BCFA]/20' : 'bg-[#1A1F2C]/40'}
                      ${isSelected ? 'ring-4 ring-[#F97316] bg-[#F97316]/30' : ''}
                      hover:bg-[#9b87f5]/30
                    `}
                    style={{
                      fontSize: 'clamp(16px, 2.5vw, 32px)',
                    }}
                  >
                    {piece && (
                      <span className="drop-shadow-lg animate-scale-in">
                        {pieceEmojis[piece.type][piece.color]}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Захваченные фигуры белых */}
        <Card className="bg-[#1A1F2C]/80 border-[#9b87f5]/30 p-4 lg:col-span-1">
          <h3 className="text-lg font-bold text-[#D6BCFA] mb-2">⚪ Захвачено:</h3>
          <div className="flex flex-wrap gap-1">
            {captures.black.map((piece, idx) => (
              <span key={idx} className="text-2xl">
                {pieceEmojis[piece.type][piece.color]}
              </span>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Index;
