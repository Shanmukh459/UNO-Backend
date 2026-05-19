import express from "express";
import { Server } from "socket.io";
import http from "http";
import { CardColor, Player, Room } from "./types";
import { roomHelper } from "./utils/roomHelper";
import { roomManager } from "./managers/roomManger";
import { gameManager } from "./managers/gameManager";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const roomsMap = new Map<string, Room>();

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("disconnect", () => {
    console.log("user disconnected");
    try {
      const { player, roomId } = roomManager.removePlayerFromRoom(socket.id);
      io.to(roomId).emit("roomLeft", `${player.name} has left the room ${roomId}`);
    } catch (error) {
      return; //user disconnected so don't need to emit any error message
    }
  });

  socket.on("message", (message: string) => {
    console.log("message:", message);
    return socket.emit("message", message);
  });

  socket.on("createRoom", (playerName: string) => {
    const roomId = roomManager.createRoom(playerName, socket.id);
    socket.join(roomId);
    socket.emit("roomCreated", { roomId });
  });

  socket.on("joinRoom", ({ roomId, playerName }: { roomId: string; playerName: string }) => {
    try {
      roomManager.addPlayerToRoom(roomId, playerName, socket.id);
      socket.join(roomId);

      socket.to(roomId).emit("playerJoined", `${playerName} joined room ${roomId}`);
      socket.emit("roomJoined", `You joined room ${roomId}`);
    } catch (error: any) {
      return socket.emit("error", error.message);
    }
  });

  socket.on("leaveRoom", () => {
    try {
      const { roomId, player } = roomManager.removePlayerFromRoom(socket.id);
      socket.leave(roomId);

      io.to(roomId).emit("roomLeft", `${player.name} has left the room ${roomId}`);
      socket.emit("roomLeft", "You have left the room");
    } catch (error: any) {
      return socket.emit("error", error.message);
    }
  });

  socket.on("messageRoom", (message: string) => {
    try {
      const { roomId, player } = roomManager.getPlayer(socket.id);
      io.to(roomId).emit("roomMessaged", `${player.name}: ${message}`);
    } catch (error: any) {
      return socket.emit("error", error.message);
    }
  });

  socket.on("startGame", () => {
    try {
      const { roomId, room } = roomManager.getRoomBySocketId(socket.id);
      gameManager.startGame(room);

      for (const [index, player] of room.players.entries()) {
        io.to(player.socketId).emit("yourCards", {
          yourCards: room.players[index].cards,
        });
      }

      io.to(roomId).emit("gameStarted", {
        openCard: room.discardPile[room.discardPile.length - 1],
        currentPlayer: room.currentTurn,
        playerCardCounts: room.players.map((player: Player) => ({
          name: player.name,
          cardCount: player.cards.length,
        })),
      });
    } catch (error: any) {
      return socket.emit("error", error.message);
    }
  });

  socket.on("playCard", ({ cardId, chosenColor }: { cardId: string; chosenColor?: CardColor }) => {
    try {
      const socketIdToEmitYourCards = gameManager.playCard(cardId, socket.id, roomsMap, chosenColor);

      const result = roomHelper.getPlayerRoom(socket.id, roomsMap);
      if (!result) return; // should never happen

      const { roomId, gameRoom: room } = result;
      const player = room.players.find((player) => player.socketId === socket.id)!;
      if (!player) return; // should never happen

      // Check for winner
      if (player.cards.length === 0) {
        return io.to(roomId).emit("gameEnded", { winner: player.name });
      }

      io.to(socket.id).emit("yourCards", { yourCards: player.cards });

      if (socketIdToEmitYourCards) {
        const effectedPlayer = room.players.find(
          (player) => player.socketId === socketIdToEmitYourCards,
        );
        if (effectedPlayer) {
          io.to(socketIdToEmitYourCards).emit("yourCards", { yourCards: effectedPlayer.cards });
        }
      }

      const topCard = room.discardPile[room.discardPile.length - 1];
      io.to(roomId).emit("cardPlayed", {
        topCard,
        currentPlayer: room.currentTurn,
        currentColor: room.currentColor,
        currentValue: room.currentValue,
        playersCardsCounts: room.players.map((player: Player) => ({
          name: player.name,
          cardCount: player.cards.length,
        })),
        lastAction: `Player ${player.name} played ${topCard.color} ${topCard.value}`,
      });
    } catch (error: any) {
      socket.emit("error", error.message);
    }
  });

  socket.on("drawCard", () => {
    try {
      gameManager.drawCard(socket.id, roomsMap);

      const result = roomHelper.getPlayerRoom(socket.id, roomsMap);
      if (!result) return; // should never happen

      const { roomId, gameRoom: room } = result;
      const player = room.players.find((player) => player.socketId === socket.id);
      if (!player) return; // should never happen

      io.to(socket.id).emit("yourCards", { yourCards: player.cards });

      const topCard = room.discardPile[room.discardPile.length - 1];
      io.to(roomId).emit("cardPlayed", {
        topCard,
        currentPlayer: room.currentTurn,
        currentColor: room.currentColor,
        currentValue: room.currentValue,
        playersCardsCounts: room.players.map((player: Player) => ({
          name: player.name,
          cardCount: player.cards.length,
        })),
        lastAction: `Player ${player.name} drawn a card`,
      });
    } catch (error: any) {
      socket.emit("error", error.message);
    }
  });
});

server.listen(3000, () => {
  console.log("Server is running on port 3000");
});
