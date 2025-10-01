import {DiceAdjustMenu} from "./dice-adjust-menu.js"
import {rollSkill} from "./rolling.js"


export class MyCharacterSheet extends ActorSheet {
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["venture-rpg", "sheet", "actor", "character"],
      template: "systems/venture-rpg/templates/actor-sheet-character.html",
      width: 800,
      height: 800,
      tabs: [{navSelector: ".tabs", contentSelector: ".tab-content", initial: "basic-info"}]
    });
  }

  getData(options) {
    const context = super.getData(options);
    context.system = this.actor.system; // expose system shorthand
    let system = context.system;


    // Precompute stat values for untrained skills
    if (system["untrained-skills"]) {
      for (let [key, skill] of Object.entries(system["untrained-skills"])) {
        skill.statValue = system[skill.stat] || 1; // 1 as default
      }
    }
    // Precompute stat values for skills
    if (system["trained-skills"]) {
      for (let [key, skill] of Object.entries(system["trained-skills"])) {
        skill.statValue = system[skill.stat] || 1; // 1 as default
      }
    }

    //Calculate defaults
    if (!system.major_threshold_is_custom){
      system.major_threshold = 4+parseInt(system.endurance/2);
    }
    if (!system.critical_threshold_is_custom){
      system.critical_threshold = system.major_threshold+10;
    }
    if (!system.minor_wounds_is_custom){
      system.max_minor_wounds = system.endurance+1;
    }
    if (!system.major_wounds_is_custom){
      system.max_major_wounds = system.endurance+1;
    }
    if (!system.critical_wounds_is_custom){
      system.max_critical_wounds = 1;
    }
    if (!system.vim_is_custom){
      system.max_vim = 2+system.intelligence+system.intuition;
    }
    if (!system.vigour_is_custom){
      system.max_vigour = 2+system.strength+system.agility;
    }

    return context;
  }

  activateListeners(html) {
    super.activateListeners(html);

    html.find(".display-actor-info").click(ev => {
      console.log(this.actor.system);
    })

    // Add new custom skill
    html.find(".add-skill").click(ev => {
      ev.preventDefault();
      let trained = this.actor.system["trained-skills"];
      console.log(trained);
      let new_id = randomID();
      let new_skill = { name: "New Skill", stat: "strength", rank: 0 };
      trained[new_id] = new_skill;
      console.log(trained);
      this.actor.update({ "actor.system.trained-skills": trained});
      this.render();
    });

    //activate quick-rolls
    html.find(".roll-skill").click(ev => {
      ev.preventDefault();
      const d1 = $(ev.currentTarget).data("d1");
      const d2 = $(ev.currentTarget).data("d2");
      const name = $(ev.currentTarget).data("name");

      rollSkill(name, d1, d2);
    });
    //activate custom rolls
    html.find(".roll-skill-boon").click(ev => {
      ev.preventDefault();
      const d1 = $(ev.currentTarget).data("d1");
      const d2 = $(ev.currentTarget).data("d2");
      const d3 = $(ev.currentTarget).data("d3") || -1;
      const name = $(ev.currentTarget).data("name");
      new DiceAdjustMenu(name, d1, d2, d3).render(true);
      console.log("rendered a dice menu");
    });

    //activate all custom roll buttons
    html.find(".increment-button").click(ev => {
      ev.preventDefault();
      const amount = $(ev.currentTarget).data("amount");
      const field = $(ev.currentTarget).data("field");
      let new_value = {};
      new_value["system."+field] = this.actor.system[field] + parseInt(amount);
      this.actor.update(new_value);
      this.render();
    });
  }


}



Hooks.once("init", () => {
  Actors.registerSheet("venture-rpg", MyCharacterSheet, {
    types: ["character"],
    makeDefault: true
  });
});
