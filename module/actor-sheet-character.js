import {DiceAdjustMenu} from "./dice-adjust-menu.js"
import {ConfirmDeleteMenu} from "./confirm-delete-menu.js"
import {rollSkill} from "./rolling.js"
import {VentureBaseSheet} from "./actor-sheet-base.js"
import {AddWealthMenu} from "./add-wealth-menu.js";
import {SpendWealthMenu} from "./spend-wealth-menu.js";

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

  activateListeners(html){
    super.activateListeners(html);

    //Add and spend money
    html.find(".get-money").click(ev => {
      new AddWealthMenu(this.actor).render(true);
    });
    html.find(".spend-money").click(ev => {
      new SpendWealthMenu(this.actor).render(true);
    });
  }
}

Hooks.once("init", () => {
  foundry.documents.collections.Actors.registerSheet("venture-rpg", MyCharacterSheet, {
    types: ["character"],
    makeDefault: true
  });
});
