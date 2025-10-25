import {DiceAdjustMenu} from "./dice-adjust-menu.js"
import {ConfirmDeleteMenu} from "./confirm-delete-menu.js"
import {rollSkill} from "./rolling.js"
import {actionValues} from "../module.js"


export class VentureBaseSheet extends ActorSheet {

  getData(options) {
    const context = super.getData(options);
    context.system = this.actor.system; // expose system shorthand
    let system = context.system;

    this.calculate_defaults(system);

    //Are we editing anything?
    system.edit_field = this.edit_field;
    
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


    //Calculate largest damage track and burn track
    system.largest_wounds = Math.max(system.max_guard,system.max_minor_wounds,system.max_major_wounds,system.max_critical_wounds);
    system.largest_stat = Math.max(system.strength, system.agility, system.intelligence, system.intuition, system.endurance, system.fuel);
    system.largest_resource = Math.max(system.max_steam, system.max_vigour, system.max_vim);

    //Equip a weapon if none
    if (system.weapons ){
      if (! system.equipped_weapon || !system.weapons[system.equipped_weapon])system.equipped_weapon = Object.keys(system.weapons)[0];
    } else {
      system.equipped_weapon = null;
    }

    //Alter weapon abilities to apply rolls and correct weapon:
    system.abilities_prepared = {};
    if(!system.abilities)system.abilities={};
    for (let [key, ability] of Object.entries(system["abilities"])) {
      let ability_copy = {...ability};
      if (ability_copy.skill != "None"){
        try {
          let skill = system.trained_skills[ability_copy.skill];
          ability_copy.statValue = skill.statValue;
          ability_copy.rank = skill.rank;
          ability_copy.skill_name = skill.name
        } catch (err) {}
      } else {
        ability_copy.skill_name = "None";
      }
      if (ability_copy.type == "weapon" && system.equipped_weapon){
        let equipped_weapon = system.weapons[system.equipped_weapon];
        if (equipped_weapon.stat){
          ability_copy.statValue = system[equipped_weapon.stat];
        }
        if (ability_copy.action == "weapon") ability_copy.action = equipped_weapon.action;
        ability_copy.description += "\n Weapon info: "+equipped_weapon.description;
      }
      if (ability_copy.action == "none")ability_copy.action=null; 
      if (ability_copy.cost && ability_copy.costtype){
        try{
          let resource_amount = system["max_"+ability_copy.costtype] - system[ability_copy.costtype];
          if (resource_amount < ability_copy.cost) ability_copy.too_expensive = true;
          else ability_copy.too_expensive = false;
        } catch (err) {}
      }

      system.abilities_prepared[key] = ability_copy;
    }

    //Check if the actor is a combatant, and add appropriate flags if so
    const currentCombat = game.combats.active;
    if (currentCombat) {
      const combatant = currentCombat.combatants.find(c => c.actorId === this.actor.id);
      if(combatant){
        console.log("this is a combatant");
        const actionsUsed = combatant.getFlag("venture-rpg","actionsUsed") || 0;
        const reactionsUsed = combatant.getFlag("venture-rpg","reactionsUsed") || 0;
        system.in_combat = true;
        system.actions_unavailable = {
          fast: !(actionsUsed <= 4),
          medium: !(actionsUsed <= 3),
          slow: !(actionsUsed <= 0),
          reaction: !(reactionsUsed <= (system.max_reactions || 1))
        }
      }else{
        system.in_combat=false;
        system.actions_unavailable = {
          fast: false,
          medium: false,
          slow: false,
          reaction: false
        }
      }
    }

    return context;
  }

  calculate_defaults(system) {
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
      system.max_vim = system.intelligence+system.intuition;
    }
    if (!system.vigour_is_custom){
      system.max_vigour = system.strength+system.agility;
    }
  }

  activateListeners(html) {
    super.activateListeners(html);

    html.find(".display-actor-info").click(ev => {
      console.log(this.actor.system);
    })

    // Add new custom skill
    html.find(".add-skill").click(ev => {
      ev.preventDefault();
      let new_skill = { name: "New Skill", stat: "strength", rank: this.get_default_skill_rank() };
      this.add_skill(new_skill);
    });

    // Add new ability
    html.find(".add-ability").click(ev => {
      ev.preventDefault();
      const new_ability = { name: "New Ability", action:"none", roll_type:"skill", description: "", skill: "None" };
      this.add_ability(new_ability);
    });

    // Add new item
    html.find(".add-equipment").click(ev => {
      ev.preventDefault();
      const item_type = $(ev.currentTarget).data("type");
      const new_equipment = {name:"New item",description:"", item_type: item_type};
      this.add_equipment(new_equipment);
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
    });

    //activate resource usage buttons
    html.find(".pay-cost").click(ev => {
      ev.preventDefault();
      const cost = $(ev.currentTarget).data("cost");
      const costtype = $(ev.currentTarget).data("costtype");
      if (!cost || !costtype)return;
      let new_value = {};
      new_value["system."+costtype] = this.actor.system[costtype]+cost;
      this.actor.update(new_value);
      this.render();
    });
    //activate action usage buttons
    html.find(".use-action").click(ev => {
      ev.preventDefault();
      const action = $(ev.currentTarget).data("action");
      console.log("trying to use action",action);
      const currentCombat = game.combats.active;
      if (currentCombat) {
        const combatant = currentCombat.combatants.find(c => c.actorId === this.actor.id);
        if(combatant){
          console.log("updating a combatant");
          if(action == "reaction") combatant.setFlag("venture-rpg","reactionsUsed",combatant.getFlag("venture-rpg","reactionsUsed") + 1);
          else combatant.setFlag("venture-rpg","actionsUsed",combatant.getFlag("venture-rpg","actionsUsed") + actionValues[action]);
          console.log("combatant updated");
        }
      }
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


    //activate delete buttons
    html.find(".delete-button").click(ev => {
      ev.preventDefault();
      const type = $(ev.currentTarget).data("type");
      const key = $(ev.currentTarget).data("key");
      const name = $(ev.currentTarget).data("name");
      new ConfirmDeleteMenu(this.actor, name, type, key).render(true);
    });

    //Editing of items
    html.find(".edit-item").click(ev => {
      ev.preventDefault();
      //TBD: Fix this
      return null;
    });

    //Activate listeners for toggling editing of blocks
    html.find(".toggle-edit").click(ev => {
      ev.preventDefault();
      const field = $(ev.currentTarget).data("field");
      if(!this.edit_field)this.edit_field={};
      this.edit_field[field] = !this.edit_field[field];
      this.render();
    });

    //Listen for combatant updates
    Hooks.on("updateCombatant", (combatant, changes) => {
      if(combatant.actorId == this.actor.id){
        if(changes.flags)this.render();
      }
    });
  }

  get_default_skill_rank(){
    return 1;
  }

  //Add a skill
  add_skill(new_skill){
    let trained = this.actor.system["trained_skills"] || {};
    let new_id = randomID();
    trained[new_id] = new_skill;
    this.actor.update({ "system.trained_skills": trained});
    this.render();
  }

  //Add an ability
  add_ability(new_ability){
    let abilities = {};
    let new_id = randomID();
    abilities[new_id] = new_ability;
    this.actor.update({ "system.abilities": abilities});
    this.render();
  }

  //Add equipment
  add_equipment(new_equipment){
    // Add new item
    let equipment = {};
    let new_id = randomID();
    equipment[new_id] = new_equipment;
    if (new_equipment.item_type == "weapon")this.actor.update({ "system.weapons": equipment});
    else this.actor.update({ "system.equipment": equipment});
    this.render();
  }

  async _onDrop(ev){
    console.log("A drop event has occured");

    const data = JSON.parse(event.dataTransfer.getData("text/plain"));
    console.log("Dropped data:", data);

    // Retrieve the dropped Item document
    const item = await Item.fromDropData(data);
    if (!item) return;

    console.log(item);

    if(item.type=="ability")this.add_ability(item.system);
    else if(item.type=="equipment")this.add_equipment(item.system);
    else if(item.type=="skill")this.add_skill(item.system);
  }


}
