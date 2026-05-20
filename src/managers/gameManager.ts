import { gameService } from "../services/gameService";
import { CardColor, Room } from "../types";
import { gameValidator } from "../Validators/gameValidator";

const startGame = (room: Room): void => {
  gameValidator.validateStartGame(room);
  gameService.initializeGame(room);
};

const playCard = (
  cardId: string,
  socketId: string,
  rooms: Map<string, Room>,
  chosenColor?: CardColor,
): string | null => {
  const { gameRoom, droppedCard } = gameValidator.validatePlayCard(
    cardId,
    socketId,
    rooms,
    chosenColor,
  );
  return gameService.playCard(gameRoom, droppedCard, chosenColor);
};

const drawCard = (socketId: string, roomsMap: Map<string, Room>): void => {
  const { gameRoom, player } = gameValidator.validateDrawCard(socketId, roomsMap);
  gameService.drawCard(player, gameRoom);
};

export const gameManager = {
  startGame,
  playCard,
  drawCard,
};
