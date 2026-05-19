import { Card } from '../types';

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

export const gameHelper = { canPlayCard, getNextTurn };
