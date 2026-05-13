import { Room } from "../types";

export const gameHelper = {
  getPlayerRoom(socketId: string, roomsMap: Map<string, Room>): { roomId: string, room: Room } | null {
    for (const [roomId, room] of roomsMap.entries()) {
      if (room.players.some(player => player.socketId === socketId)) return { roomId, room };
    }
  
    return null;
  }
}