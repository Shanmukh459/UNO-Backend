import express from 'express';
import { Server } from 'socket.io';
import http from 'http';
import { Player, Room } from './types';
import { dealCards, getShuffledDeck } from './utils/deck';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});



const roomsMap = new Map<string, Room>();


io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('disconnect', () => {
    console.log('user disconnected');
    for (const [roomId, room] of roomsMap) {
      const playerIndex = room.players.findIndex(
        (player: Player) => socket.id === player.socketId,
      );
      const player = room.players[playerIndex];

      if (playerIndex !== -1) {
        room.players.splice(playerIndex, 1);
        io.to(roomId).emit(
          'roomLeft',
          `${player.name} has left the room ${roomId}`,
        );
      }

      if (room.players.length === 0) roomsMap.delete(roomId);

      return;
    }
  });

  socket.on('message', (message: string) => {
    console.log('message:', message);
    return socket.emit('message', message);
  });

  socket.on('createRoom', (playerName: string) => {
    const roomId = Math.random().toString(36).substring(2, 8);
    roomsMap.set(roomId, {
      players: [{ name: playerName, socketId: socket.id, cards: [] }],
      gameStarted: false,
      currentTurn: 0,
      currentColor: null,
      currentValue: null,
      gameDirection: 1,
      drawPile: [],
      discardPile: [],
    });
    socket.join(roomId);
    socket.emit('roomCreated', { roomId });
  });

  socket.on(
    'joinRoom',
    ({ roomId, playerName }: { roomId: string; playerName: string }) => {
      console.log('joinRoom:', roomId, playerName, roomsMap);
      const room = roomsMap.get(roomId);
      if (!room) {
        return socket.emit('error', 'Room not found!');
      }

      room.players.push({ name: playerName, socketId: socket.id, cards: [] });
      socket.join(roomId);
      console.log('Updated room:', roomsMap);
      socket
        .to(roomId)
        .emit('playerJoined', `${playerName} joined room ${roomId}`);
      socket.emit('roomJoined', `You joined room ${roomId}`);
    },
  );

  socket.on('leaveRoom', () => {
    for (const [roomId, room] of roomsMap) {
      const playerIndex = room.players.findIndex(
        (player) => player.socketId === socket.id,
      );
      const player = room.players[playerIndex];

      if (playerIndex !== -1) {
        room.players.splice(playerIndex, 1);
        socket.leave(roomId);

        io.to(roomId).emit(
          'roomLeft',
          `${player.name} has left the room ${roomId}`,
        );

        if (room.players.length === 0) roomsMap.delete(roomId);

        return;
      }
    }

    socket.emit('roomLeft', 'You are not in any room');
  });

  socket.on('messageRoom', (message: string) => {
    for (const [roomId, room] of roomsMap) {
      const player = room.players.find(
        (player: Player) => player.socketId === socket.id,
      );

      if (!player) continue;

      return io.to(roomId).emit('roomMessaged', `${player.name}: ${message}`);
    }

    socket.emit('roomMessaged', 'You are not in any room');
  });

  socket.on('startGame', () => {
    for (const [roomId, room] of roomsMap) {
      const player = room.players.find(
        (player: Player) => player.socketId === socket.id,
      );

      if (player && !room.gameStarted) {
        room.gameStarted = true;
        const shuffledDeck = getShuffledDeck();
        const { playersCards, drawPile, openCard } = dealCards(
          shuffledDeck,
          room.players.length,
        );

        room.drawPile = drawPile;
        room.discardPile = [openCard];
        room.currentColor = openCard.color;
        room.currentValue = openCard.value;
        room.currentTurn = 0;
        room.gameDirection = 1;

        for (const [index, player] of room.players.entries()) {
          room.players[index].cards = playersCards[index];
          io.to(player.socketId).emit('yourCards', {
            yourCards: playersCards[index],
          });
        }

        io.to(roomId).emit('gameStarted', {
          openCard,
          currentPlayer: room.currentTurn,
          playerCardCounts: room.players.map((player: Player) => ({
            name: player.name,
            cardCount: player.cards.length,
          })),
        });
        return;
      }
    }

    socket.emit('error', 'Join a room to start the game');
  });
});

server.listen(3000, () => {
  console.log('Server is running on port 3000');
});
