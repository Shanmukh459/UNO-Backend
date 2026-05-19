import { gameService } from "../services/gameService";
import { Room } from "../types";
import { gameValidator } from "../Validators/gameValidator";

const startGame = (room: Room): void => {
  gameValidator.validateStartGame(room);
  gameService.initializeGame(room);
};

export const gameManager = {
  startGame,
};
