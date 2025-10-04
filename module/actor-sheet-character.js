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

    // Create stats list
    system.current_stats = {
      "strength": system.strength - system.strength_burn || 1,
      "agility": system.agility - system.agility_burn || 1,
      "intelligence": system.intelligence - system.intelligence_burn || 1,
      "intuition": system.intuition - system.intuition_burn || 1,
    }

    // Precompute stat values for untrained skills
    if (system["untrained_skills"]) {
      for (let [key, skill] of Object.entries(system["untrained_skills"])) {
        skill.statValue = system.current_stats[skill.stat];
      }
    }
    // Precompute stat values for skills
    if (system["trained_skills"]) {
      for (let [key, skill] of Object.entries(system["trained_skills"])) {
        skill.statValue = system.current_stats[skill.stat];
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

    //Calculate largest damage track and burn track
    system.largest_wounds = Math.max(system.max_guard,system.max_minor_wounds,system.max_major_wounds,system.max_critical_wounds);
    system.largest_stat = Math.max(system.strength, system.agility, system.intelligence, system.intuition, system.endurance, system.fuel);
    system.largest_resource = Math.max(system.max_steam, system.max_vigour, system.max_vim);

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
      let trained = this.actor.system["trained_skills"] || {};
      let new_id = randomID();
      let new_skill = { name: "New Skill", stat: "strength", rank: 0 };
      trained[new_id] = new_skill;
      this.actor.update({ "system.trained_skills": trained});
      this.render();
    });

    // Add new ability
    html.find(".add-ability").click(ev => {
      ev.preventDefault();
      let abilities = this.actor.system["abilities"] || {};
      let new_id = randomID();
      let new_ability = { name: "New Ability", description: "", skill: "None" };
      abilities[new_id] = new_ability;
      this.actor.update({ "system.abilities": abilities});
      this.render();
    });

    // Add new item
    html.find(".add-equipment").click(ev => {
      ev.preventDefault();
      let equipment = this.actor.system["equipment"] || {};
      let new_id = randomID();
      let new_item = { name: "New Item", description: "" };
      equipment[new_id] = new_item;
      this.actor.update({ "system.equipment": equipment});
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
      let d3 = $(ev.currentTarget).data("d3");
      if (d3 === null) d3=-1;
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
