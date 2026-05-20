import { Player, Room } from "../types";

const rooms = new Map<string, Room>();

// ==== PRIVATE METHODS ====
const getPlayerRoom = (socketId: string): { roomId: string; room: Room } | null => {
  for (const [roomId, room] of rooms.entries()) {
    if (room.players.some((player) => player.socketId === socketId)) return { roomId, room };
  }
  throw new Error("You are not in any room!");
};

// ==== PUBLIC METHODS ====
const createRoom = (playerName: string, socketId: string) => {
  const roomId = Math.random().toString(36).substring(2, 8);
  rooms.set(roomId, {
    players: [{ name: playerName, socketId: socketId, cards: [] }],
    gameStarted: false,
    currentTurn: 0,
    currentColor: null,
    currentValue: null,
    gameDirection: 1,
    drawPile: [],
    discardPile: [],
  });
  return roomId;
};

const addPlayerToRoom = (roomId: string, playerName: string, socketId: string): void => {
  const room = rooms.get(roomId);

  if (!room) throw new Error("Room not found!");
  if (room.gameStarted) throw new Error("Game has already started!");

  room.players.push({ name: playerName, socketId: socketId, cards: [] });
};

const removePlayerFromRoom = (socketId: string): { roomId: string; player: Player } => {
  const result = getPlayerRoom(socketId);
  if (!result) throw new Error("You are not in any room!");

  const { roomId, room } = result;
  const playerIndex = room.players.findIndex((player) => player.socketId === socketId);

  if (playerIndex !== -1) {
    const player = room.players[playerIndex];
    room.players.splice(playerIndex, 1);

    if (room.players.length === 0) rooms.delete(roomId);
    return { roomId, player };
  }
  throw new Error("You are not present in the room");
};

const getPlayer = (socketId: string): { roomId: string; player: Player } => {
  const result = getPlayerRoom(socketId);
  if (!result) throw new Error("You are not in any room!");

  const { roomId, room } = result;
  const player = room.players.find((player) => player.socketId === socketId);
  if (!player) throw new Error("You are not present in the room");

  return { roomId, player };
};

const getRoom = (roomId: string) => {
  const room = rooms.get(roomId);
  if (!room) throw new Error("Room not found!");
  return room;
};

const getRoomBySocketId = (socketId: string): {roomId: string; room: Room} => {
  const { roomId } = getPlayerRoom(socketId)!;
  const room = getRoom(roomId);

  return {roomId, room};
}

export const roomManager = {
  createRoom,
  getRoom,
  addPlayerToRoom,
  removePlayerFromRoom,
  getPlayer,
  getRoomBySocketId,
};
