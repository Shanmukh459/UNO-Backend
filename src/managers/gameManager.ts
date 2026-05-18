import { Card, Room } from "../types";
import { deckUtils } from "../utils/deck";

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

// ==== PUBLIC METHODS ====

const startGame = (room: Room): void => {
  if (room.gameStarted) throw new Error("Game has already started!");
  if (room.players.length < 2)
    throw new Error("At least 2 players are required to start the game!");

  const shuffledDeck = deckUtils.getShuffledDeck();
  const { playersCards, drawPile, openCard } = deckUtils.dealCards(
    shuffledDeck,
    room.players.length,
  );

  initializeRoom(room, drawPile, openCard, playersCards);
  applyOpenCardEffect(room, openCard); // handle special opening cards like skip, reverse, draw2
};

export const gameManager = {
  startGame,
};
