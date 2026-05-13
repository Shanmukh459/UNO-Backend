import { Card, CardColor, Room } from '../types';
import { gameHelper } from './helper';

const canPlayCard = (topCard: Card, playerCard: Card) => {
  return (
    topCard.color === playerCard.color ||
    topCard.value === playerCard.value ||
    playerCard.color === null
  );
};

const getNextTurn = (
  currentTurn: number,
  direction: number,
  numPlayers: number,
) => {
  let nextTurn = currentTurn + direction;

  if (nextTurn >= numPlayers) return nextTurn % numPlayers;
  if (nextTurn < 0) return numPlayers - (Math.abs(nextTurn) % numPlayers);
  return nextTurn;
};

const playCard = (
  cardId: string,
  socketId: string,
  roomsMap: Map<string, Room>,
  chosenColor?: CardColor,
): void => {
  const result = gameHelper.getPlayerRoom(socketId, roomsMap);
  if(!result) throw new Error(`Error: Game doesn't exists`);
  
  const { room: gameRoom } = result;
  const player = gameRoom.players.find(
    (player) => player.socketId === socketId,
  );
  if (!player) throw new Error(`Error: Player doesn't belong to the room`);

  const currentPLayerIndex = gameRoom.currentTurn;
  const currentPlayer = gameRoom.players[currentPLayerIndex];

  if (currentPlayer.socketId !== socketId)
    throw new Error(`Error: It's not the player's turn`);

  const playerCards = player.cards;
  const droppedCard = playerCards.find((card) => card.id === cardId);
  if (!droppedCard)
    throw new Error(
      `Error: Player - ${player.name} doesn't have the selected card`,
    );

  const topCard = gameRoom.discardPile[gameRoom.discardPile.length - 1];
  if (!canPlayCard(topCard, droppedCard))
    throw new Error(`Error: This card can't be played`);

  player.cards = player.cards.filter((card) => card.id !== cardId);
  gameRoom.discardPile.push(droppedCard);

  if (droppedCard.value === 'reverse')
    gameRoom.gameDirection = gameRoom.gameDirection === 1 ? -1 : 1;

  if (droppedCard.value === 'wild' || droppedCard.value === 'wildDraw4') {
    if (!chosenColor)
      throw new Error(`Error: Color must be selected when WILD card played`);
    gameRoom.currentColor = chosenColor;
  } else {
    gameRoom.currentColor = droppedCard.color;
  }
  gameRoom.currentValue = droppedCard.value;

  const nextPlayerIndex = getNextTurn(
    gameRoom.currentTurn,
    gameRoom.gameDirection,
    gameRoom.players.length,
  );

  const nextPlayer = gameRoom.players[nextPlayerIndex];

  if (droppedCard.value === 'draw2') {
    for (let i = 0; i < 2; i++) {
      const drawCard = gameRoom.drawPile.shift();
      if (drawCard) nextPlayer.cards.push(drawCard);
    }

    gameRoom.currentTurn = getNextTurn(
      nextPlayerIndex,
      gameRoom.gameDirection,
      gameRoom.players.length,
    );
    return;
  } else if (droppedCard.value === 'wildDraw4') {

    for (let i = 0; i < 4; i++) {
      const drawCard = gameRoom.drawPile.shift();
      if (drawCard) nextPlayer.cards.push(drawCard);
    }

    gameRoom.currentTurn = getNextTurn(
      nextPlayerIndex,
      gameRoom.gameDirection,
      gameRoom.players.length,
    );
    return;
  } else if (droppedCard.value === 'skip') {
    gameRoom.currentTurn = getNextTurn(
      nextPlayerIndex,
      gameRoom.gameDirection,
      gameRoom.players.length,
    );
    return;
  }

  gameRoom.currentTurn = nextPlayerIndex
};

const drawCard = (socketId: string, roomsMap: Map<string, Room>): void => {
  const result = gameHelper.getPlayerRoom(socketId, roomsMap);
  if(!result) throw new Error(`Error: Game doesn't exists`);

  const { room: gameRoom } = result
  const player = gameRoom.players.find(player => player.socketId === socketId)
  if (!player) throw new Error(`Error: Player doesn't belong to the room`);

  const currentPlayer = gameRoom.players[gameRoom.currentTurn];
  if(currentPlayer.socketId !== socketId) throw new Error(`Error: Not your turn`);

  if(gameRoom.drawPile.length === 0)
    throw new Error(`Error: No cards left to draw`);

  const drawnCard = gameRoom.drawPile.shift()!;
  player.cards.push(drawnCard);

  gameRoom.currentTurn = getNextTurn(
    gameRoom.currentTurn,
    gameRoom.gameDirection,
    gameRoom.players.length,
  );
}

export { canPlayCard, getNextTurn, playCard, drawCard };
