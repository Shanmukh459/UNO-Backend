import { CardColor, Card, CardValue } from "../types";

const cardColors: CardColor[] = ['red', 'green', 'blue', 'yellow'];

const generateDeck = (): Card[] => {
  const deck: Card[] = [];

  for (const color of cardColors) {
    deck.push({ id: `0-${color}-1`, color, value: '0' });

    for (let i = 1; i < 3; i++) {
      for (let value = 1; value < 10; value++) {
        deck.push({
          id: `${value}-${color}-${i}`,
          color,
          value: value.toString() as CardValue,
        });
      }
      deck.push({ id: `skip-${color}-${i}`, color, value: 'skip' });
      deck.push({ id: `reverse-${color}-${i}`, color, value: 'reverse' });
      deck.push({ id: `draw2-${color}-${i}`, color, value: 'draw2' });
    }
  }

  for (let i = 1; i < 5; i++) {
    deck.push({ id: `wild-${i}`, color: null, value: 'wild' });
    deck.push({ id: `wildDraw4-${i}`, color: null, value: 'wildDraw4' });
  }

  return deck;
};

// Fisher-Yates shuffle algorithm
const shuffleDeck = (deck: Card[]): Card[] => {
  for (let i = deck.length - 1; i >= 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = deck[i];
    deck[i] = deck[j];
    deck[j] = temp;
  }
  return deck;
};

const dealCards = (
  deck: Card[],
  numPlayers: number,
): { playersCards: Card[][]; drawPile: Card[]; openCard: Card } => {
  const playerCards: Card[][] = [];

  for (let i = 0; i < numPlayers; i++) {
    playerCards.push(deck.splice(0, 7));
  }

  let openCard: Card = deck.shift() as Card;

  while (openCard.value === 'wild' || openCard.value === 'wildDraw4') {
    deck.push(openCard);
    openCard = deck.shift() as Card;
  }

  return { playersCards: playerCards, drawPile: deck, openCard };
};

const getShuffledDeck = (): Card[] => shuffleDeck(generateDeck());

export const deckUtils = {
  getShuffledDeck,
  dealCards
}