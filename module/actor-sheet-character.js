import {DiceAdjustMenu} from "./dice-adjust-menu.js"
import {ConfirmDeleteMenu} from "./confirm-delete-menu.js"
import {rollSkill} from "./rolling.js"
import {VentureBaseSheet} from "./actor-sheet-base.js"

export class MyCharacterSheet extends VentureBaseSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["venture-rpg", "sheet", "actor", "character"],
      template: "systems/venture-rpg/templates/actor-sheet-character.html",
      width: 800,
      height: 800,
      tabs: [{navSelector: ".tabs", contentSelector: ".tab-content", initial: "basic-info"}]
    });
  }
}

Hooks.once("init", () => {
  foundry.documents.collections.Actors.registerSheet("venture-rpg", MyCharacterSheet, {
    types: ["character"],
    makeDefault: true
  });
});
