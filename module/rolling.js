
export const VALUE_TO_DIE = {
  0: "d1",
  1: "d4",
  2: "d6",
  3: "d8",
  4: "d10",
  5: "d12",
  6: "d20"
};

export function rollSkill(name, d1, d2, d3=-1) {
  const skillDie = VALUE_TO_DIE[d1] || "d1";
  const statDie = VALUE_TO_DIE[d2] || "d4";
  const helpDie = VALUE_TO_DIE[d3] || "0"

  // Construct the Roll formula
  let formula;
  if(d1 > -1 && d2 > -1) formula = `1${skillDie} + 1${statDie}`;
  else formula = "";
  if (d3 >= 0) formula+=` + 1${helpDie}`;

  // Roll it using Foundry's Roll class
  const roll = new Roll(formula);
  roll.toMessage({
    speaker: ChatMessage.getSpeaker({actor: game.user.character}),
    flavor: `Rolling ${name} (${formula})`
  });
}