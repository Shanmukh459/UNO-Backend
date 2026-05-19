import { Room, CardColor, Card } from "../types";
import { deckUtils } from "../utils/deck";
import { gameHelper } from "../utils/gameHelper";
import { roomHelper } from "../utils/roomHelper";

// ==== PRIVATE METHODS ====

const initializeRoom = (
  room: Room,
  drawPile: Card[],
  openCard: Card,
  playersCards: Card[][],
): void => {
  room.gameStarted = true;
  room.drawPile = drawPile;
  room.discardPile = [openCard];
  room.currentColor = openCard.color;
  room.currentValue = openCard.value;
  room.currentTurn = 0;
  room.gameDirection = 1;

  for (const [index] of room.players.entries()) {
    room.players[index].cards = playersCards[index];
  }
};

const applyOpenCardEffect = (room: Room, openCard: Card): void => {
  if (openCard.value === "skip") {
    room.currentTurn = 1;
  }

  if (openCard.value === "reverse") {
    room.gameDirection = -1;
    room.currentTurn = room.players.length - 1;
  }

  if (openCard.value === "draw2") {
    const nextPlayerIndex = room.currentTurn;
    const nextPlayer = room.players[nextPlayerIndex];
    for (let i = 0; i < 2; i++) {
      const drawCard = room.drawPile.shift();
      if (drawCard) nextPlayer.cards.push(drawCard);
    }
    room.currentTurn = 1;
  }
};

const dealCards = (playersCount: number): { playersCards: Card[][]; drawPile: Card[]; openCard: Card } => {
  const shuffledDeck = deckUtils.getShuffledDeck();
  const { playersCards, drawPile, openCard } = deckUtils.dealCards(
    shuffledDeck,
    playersCount,
  ); 
  return { playersCards, drawPile, openCard };
};

// ==== PUBLIC METHODS ====

const initializeGame = (
  room: Room,
): void => {
  const { playersCards, drawPile, openCard } = dealCards(room.players.length);
  initializeRoom(room, drawPile, openCard, playersCards);
  applyOpenCardEffect(room, openCard);
};

const playCard = (
  cardId: string,
  socketId: string,
  roomsMap: Map<string, Room>,
  chosenColor?: CardColor,
): string | null => {
  const result = roomHelper.getPlayerRoom(socketId, roomsMap);
  if (!result) throw new Error(`Error: Game doesn't exists`);

  const { room: gameRoom } = result;
  const player = gameRoom.players.find((player) => player.socketId === socketId);
  if (!player) throw new Error(`Error: Player doesn't belong to the room`);

  const currentPLayerIndex = gameRoom.currentTurn;
  const currentPlayer = gameRoom.players[currentPLayerIndex];

  if (currentPlayer.socketId !== socketId) throw new Error(`Error: It's not the player's turn`);

  const playerCards = player.cards;
  const droppedCard = playerCards.find((card) => card.id === cardId);
  if (!droppedCard)
    throw new Error(`Error: Player - ${player.name} doesn't have the selected card`);

  const topCard = gameRoom.discardPile[gameRoom.discardPile.length - 1];
  if (!gameHelper.canPlayCard(topCard, droppedCard))
    throw new Error(`Error: This card can't be played`);

  player.cards = player.cards.filter((card) => card.id !== cardId);
  gameRoom.discardPile.push(droppedCard);

  if (droppedCard.value === "reverse")
    gameRoom.gameDirection = gameRoom.gameDirection === 1 ? -1 : 1;

  if (droppedCard.value === "wild" || droppedCard.value === "wildDraw4") {
    if (!chosenColor) throw new Error(`Error: Color must be selected when WILD card played`);
    gameRoom.currentColor = chosenColor;
  } else {
    gameRoom.currentColor = droppedCard.color;
  }
  gameRoom.currentValue = droppedCard.value;

  const nextPlayerIndex = gameHelper.getNextTurn(
    gameRoom.currentTurn,
    gameRoom.gameDirection,
    gameRoom.players.length,
  );

  const nextPlayer = gameRoom.players[nextPlayerIndex];

  if (droppedCard.value === "draw2") {
    for (let i = 0; i < 2; i++) {
      const drawCard = gameRoom.drawPile.shift();
      if (drawCard) nextPlayer.cards.push(drawCard);
    }

    const socketIdToEmitYourCards = nextPlayer.socketId;
    gameRoom.currentTurn = gameHelper.getNextTurn(
      nextPlayerIndex,
      gameRoom.gameDirection,
      gameRoom.players.length,
    );
    return socketIdToEmitYourCards;
  } else if (droppedCard.value === "wildDraw4") {
    for (let i = 0; i < 4; i++) {
      const drawCard = gameRoom.drawPile.shift();
      if (drawCard) nextPlayer.cards.push(drawCard);
    }

    const socketIdToEmitYourCards = nextPlayer.socketId;
    gameRoom.currentTurn = gameHelper.getNextTurn(
      nextPlayerIndex,
      gameRoom.gameDirection,
      gameRoom.players.length,
    );
    return socketIdToEmitYourCards;
  } else if (droppedCard.value === "skip") {
    gameRoom.currentTurn = gameHelper.getNextTurn(
      nextPlayerIndex,
      gameRoom.gameDirection,
      gameRoom.players.length,
    );
    return null;
  }

  gameRoom.currentTurn = nextPlayerIndex;
  return null;
};

const drawCard = (socketId: string, roomsMap: Map<string, Room>): void => {
  const result = roomHelper.getPlayerRoom(socketId, roomsMap);
  if (!result) throw new Error(`Error: Game doesn't exists`);

  const { room: gameRoom } = result;
  const player = gameRoom.players.find((player) => player.socketId === socketId);
  if (!player) throw new Error(`Error: Player doesn't belong to the room`);

  const currentPlayer = gameRoom.players[gameRoom.currentTurn];
  if (currentPlayer.socketId !== socketId) throw new Error(`Error: Not your turn`);

  if (gameRoom.drawPile.length === 0) throw new Error(`Error: No cards left to draw`);

  const drawnCard = gameRoom.drawPile.shift()!;
  player.cards.push(drawnCard);

  gameRoom.currentTurn = gameHelper.getNextTurn(
    gameRoom.currentTurn,
    gameRoom.gameDirection,
    gameRoom.players.length,
  );
};

export const gameService = {
  initializeGame,
  applyOpenCardEffect,
  playCard,
  drawCard,
};
