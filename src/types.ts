export interface Player {
  name: string;
  socketId: string;
  cards: Card[];
}

export interface Room {
  players: Player[];
  gameStarted: boolean;
  drawPile: Card[];
  discardPile: Card[];
  currentTurn: number;
  currentColor: CardColor | null;
  currentValue: CardValue | null;
  gameDirection: 1 | -1;
}

export interface Card {
  id: string; //5-red-1, 5-red-2
  color: CardColor | null;
  value: CardValue;
}

export type CardColor = 'red' | 'blue' | 'green' | 'yellow';
export type CardValue =
  | '0'
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | 'skip'
  | 'reverse'
  | 'draw2'
  | 'wild'
  | 'wildDraw4';