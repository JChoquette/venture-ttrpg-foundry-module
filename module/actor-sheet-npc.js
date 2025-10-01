export class MyNpcSheet extends ActorSheet {
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["venture-rpg", "sheet", "actor", "npc"],
      template: "systems/venture-rpg/templates/actor-sheet-npc.html",
      width: 400,
      height: 350
    });
  }
}

Hooks.once("init", () => {
  Actors.registerSheet("venture-rpg", MyNpcSheet, {
    types: ["npc"],
    makeDefault: true
  });
});
