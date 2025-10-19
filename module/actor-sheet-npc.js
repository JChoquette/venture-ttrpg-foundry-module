import {DiceAdjustMenu} from "./dice-adjust-menu.js"
import {ConfirmDeleteMenu} from "./confirm-delete-menu.js"
import {rollSkill} from "./rolling.js"
import {VentureBaseSheet} from "./actor-sheet-base.js"

export class MyNpcSheet extends VentureBaseSheet {
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["venture-rpg", "sheet", "actor", "npc"],
      template: "systems/venture-rpg/templates/actor-sheet-npc.html",
      width: 800,
      height: 800,
      tabs: [{navSelector: ".tabs", contentSelector: ".tab-content", initial: "basic-info"}]
    });
  }

  calculate_defaults(system) {
    if(!system.level)this.actor.update({"system.level":1});
    system.endurance = system.level;
    if (!system.strength_is_custom){
      system.strength = system.level;
    }
    if (!system.agility_is_custom){
      system.agility = system.level;
    }
    if (!system.intelligence_is_custom){
      system.intelligence = system.level;
    }
    if (!system.intuition_is_custom){
      system.intuition = system.level;
    }

    if (!system.major_threshold_is_custom){
      system.major_threshold = 4+parseInt(system.level/2);
    }
    if (!system.critical_threshold_is_custom){
      system.critical_threshold = system.major_threshold*2;
    }
    if (!system.minor_wounds_is_custom){
      system.max_minor_wounds = system.level;
    }
    if (!system.major_wounds_is_custom){
      system.max_major_wounds = system.level;
    }
    if (!system.critical_wounds_is_custom){
      system.max_critical_wounds = 1;
    }

  }
}

Hooks.once("init", () => {
  Actors.registerSheet("venture-rpg", MyNpcSheet, {
    types: ["npc"],
    makeDefault: true
  });
});
