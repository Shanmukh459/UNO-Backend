import { Room } from "../types";

const getPlayerRoom = (socketId: string, roomsMap: Map<string, Room>): { roomId: string, gameRoom: Room } | null => {
  for (const [roomId, gameRoom] of roomsMap.entries()) {
    if (gameRoom.players.some(player => player.socketId === socketId)) return { roomId, gameRoom };
  }

  throw new Error("You are not in any room!");
}

const getPlayer = (room: Room, socketId: string) => {
  const player = room.players.find(player => player.socketId === socketId);
  if (!player) throw new Error("Player not found in the room");
  return player;
}

export const roomHelper = {
  getPlayerRoom,
  getPlayer,
}