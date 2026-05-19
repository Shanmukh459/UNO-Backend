import { Card, CardColor, Player, Room } from "../types";
import { gameHelper } from "../utils/gameHelper";
import { roomHelper } from "../utils/roomHelper";

const validateGameExists = (socketId: string, rooms: Map<string, Room>) => {
  const result = roomHelper.getPlayerRoom(socketId, rooms);
  if (!result) throw new Error(`Error: Game doesn't exists`);
  return result;
};

const validatePlayerExists = (socketId: string, gameRoom: Room) => {
  const player = gameRoom.players.find((player) => player.socketId === socketId);
  if (!player) throw new Error(`Error: Player doesn't belong to the room`);
  return player;
};

const validatePlayerTurn = (socketId: string, gameRoom: Room) => {
  const currentPLayerIndex = gameRoom.currentTurn;
  const currentPlayer = gameRoom.players[currentPLayerIndex];
  if (currentPlayer.socketId !== socketId) throw new Error(`Error: It's not the player's turn`);
};

const validatePlayerHasDroppedCard = (player: Player, cardId: string) => {
  const droppedCard = player.cards.find((card) => card.id === cardId);
  if (!droppedCard)
    throw new Error(`Error: Player - ${player.name} doesn't have the selected card`);
  return droppedCard;
}

const validateDroppedCard = (topCard: Card, droppedCard: Card) => {
  if (!gameHelper.canPlayCard(topCard, droppedCard))
    throw new Error(`Error: This card can't be played`);
};

const validateChoosenColor = (droppedCard: Card, chosenColor?: CardColor) => {
  if ((droppedCard.value === "wild" || droppedCard.value === "wildDraw4") && !chosenColor)
    throw new Error(`Error: Color must be selected when WILD card played`);
};

const validateStartGame = (room: Room): void => {
  if (room.gameStarted) throw new Error("Game has already started!");

  if (room.players.length < 2)
    throw new Error("At least 2 players are required to start the game!");
};

const validatePlayCard = (cardId: string, socketId: string, rooms: Map<string, Room>, chosenColor?: CardColor) => {
  const { gameRoom } = validateGameExists(socketId, rooms);
  const player = validatePlayerExists(socketId, gameRoom);
  const droppedCard = validatePlayerHasDroppedCard(player, cardId);
  const topCard = gameRoom.discardPile[gameRoom.discardPile.length - 1];

  validatePlayerTurn(socketId, gameRoom);
  validateDroppedCard(topCard, droppedCard);
  validateChoosenColor(droppedCard, chosenColor);

  return { gameRoom, droppedCard };
};

export const gameValidator = {
  validateStartGame,
  validatePlayCard,
};
