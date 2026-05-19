import { Room } from "../types";

const validateStartGame = (room: Room): void => {
  if (room.gameStarted) throw new Error("Game has already started!");

  if (room.players.length < 2)
    throw new Error("At least 2 players are required to start the game!");
};

export const gameValidator = {
  validateStartGame,
};
