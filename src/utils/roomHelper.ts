import { Room } from "../types";

export const roomHelper = {
  getPlayerRoom(socketId: string, roomsMap: Map<string, Room>): { roomId: string, gameRoom: Room } | null {
    for (const [roomId, gameRoom] of roomsMap.entries()) {
      if (gameRoom.players.some(player => player.socketId === socketId)) return { roomId, gameRoom };
    }
  
    return null;
  }
}