import { Card } from "../types";

const canPlayCard = (topCard: Card, playerCard: Card) => {
  return topCard.color === playerCard.color || topCard.value === playerCard.value || playerCard.color === null;
}



