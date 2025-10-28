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
    context.edit_field = this.edit_field;
    
    // Create stats list
    context.current_stats = {
      "strength": system.strength - system.strength_burn || 1,
      "agility": system.agility - system.agility_burn || 1,
      "intelligence": system.intelligence - system.intelligence_burn || 1,
      "intuition": system.intuition - system.intuition_burn || 1,
    }

    //Split up and filter the items
    let weapons = [];
    let equipment = [];
    let abilities = [];
    let skills = [];
    for(let item of this.actor.items){
      console.log(item);
      switch(item.type){
        case "weapon": weapons.push(item);break;
        case "equipment": equipment.push(item);break;
        case "ability": abilities.push(item);break;
        case "skill": skills.push(item);break;
      }
    }
    //TODO: do all the editing here

    context.all_items = {
      "weapon": weapons,
      "equipment": equipment,
      "ability": abilities,
      "skill": skills
    }

    //TODO: Redo this for Item-based skills
    // Precompute stat values for untrained skills
    if (system["untrained_skills"]) {
      for (let [key, skill] of Object.entries(system["untrained_skills"])) {
        skill.statValue = context.current_stats[skill.stat];
      }
    }
    // Precompute stat values for skills
    if (system["trained_skills"]) {
      for (let [key, skill] of Object.entries(system["trained_skills"])) {
        skill.statValue = context.current_stats[skill.stat];
      }
    }


    //Calculate largest damage track and burn track
    context.largest_wounds = Math.max(system.max_guard,system.max_minor_wounds,system.max_major_wounds,system.max_critical_wounds);
    context.largest_stat = Math.max(system.strength, system.agility, system.intelligence, system.intuition, system.endurance, system.fuel);
    context.largest_resource = Math.max(system.max_steam, system.max_vigour, system.max_vim);

    //Check if the actor is a combatant, and add appropriate flags if so
    const currentCombat = game.combats.active;
    if (currentCombat) {
      const combatant = currentCombat.combatants.find(c => c.actorId === this.actor.id);
      if(combatant){
        console.log("this is a combatant");
        const actionsUsed = combatant.getFlag("venture-rpg","actionsUsed") || 0;
        const reactionsUsed = combatant.getFlag("venture-rpg","reactionsUsed") || 0;
        context.action_info = {
          in_combat : true,
          actions_used : actionsUsed,
          reactions_used : reactionsUsed,
          max_reactions : system.max_reactions,
        }
      }else{
        context.action_info = {in_combat:false}
      }
    }else context.action_info = {in_combat:false}

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

    //Create an item
    html.find(".item-create").click(this._onItemCreate.bind(this));
    html.find(".edit-item").click(this._onItemEdit.bind(this));
    html.find(".delete-item").click(this._onItemDelete.bind(this));


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
      ui.notifications.info(`Spent ${cost} ${costtype}`);
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
          ui.notifications.info(`Used action: ${action}`);
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

  async _onItemCreate(event) {
    const type = event.currentTarget.dataset.type;
    await this.actor.createEmbeddedDocuments("Item", [{
      name: `New ${type}`,
      type,
      system: {}
    }]);
  }

  async _onItemDelete(event) {
    const elem = $(event.currentTarget).closest(".item");
    const item = this.actor.items.get(elem.data("itemId"));
    new ConfirmDeleteMenu(this.actor, item).render(true);
  }

  _onItemEdit(event) {
    const elem = $(event.currentTarget).closest(".item");
    const item = this.actor.items.get(elem.data("itemId"));
    item.sheet.render(true);
  }

  // //Add a skill
  // add_skill(new_skill){
  //   let trained = this.actor.system["trained_skills"] || {};
  //   let new_id = randomID();
  //   trained[new_id] = new_skill;
  //   this.actor.update({ "system.trained_skills": trained});
  //   this.render();
  // }

  // //Add an ability
  // add_ability(new_ability){
  //   let abilities = {};
  //   let new_id = randomID();
  //   abilities[new_id] = new_ability;
  //   this.actor.update({ "system.abilities": abilities});
  //   this.render();
  // }

  // //Add equipment
  // add_equipment(new_equipment){
  //   // Add new item
  //   let equipment = {};
  //   let new_id = randomID();
  //   equipment[new_id] = new_equipment;
  //   if (new_equipment.item_type == "weapon")this.actor.update({ "system.weapons": equipment});
  //   else this.actor.update({ "system.equipment": equipment});
  //   this.render();
  // }

  async _onDrop(ev){

    const data = JSON.parse(event.dataTransfer.getData("text/plain"));

    // Retrieve the dropped Item document
    const item = await Item.fromDropData(data);
    if (!item) return;

    const itemData = item.toObject();

    if(itemData.type=="ability"){
      const skill_id = itemData.system.skill_id;
      const skill_name = itemData.system.skill;
      //Try to find the corresponding skill, so long as it isn't other, none, or empty
      if(skill_id && skill_id != "none" && skill_id !="Other"){
        let skill_found = false;
        //Try to find a skill created from the compendium
        for(let skill of this.actor.items){
          if(skill.type == "skill" && skill_id == skill.system.skill_id){
            skill_found = true;
            itemData.system.skill = skill.id;
            break;
          }
        }
        //Try to find a skill with a matching name
        if(!skill_found){
          for(let skill of this.actor.items){
            if(skill.type == "skill" && skill_name == skill.name){
              skill_found = true;
              itemData.system.skill = skill.id;
              break;
            }
          }
        }
        //Try to find it in the compendium
        if(!skill_found){
          const pack = await game.packs.get("venture-rpg.skills");
          const skills = await pack.getDocuments();
          for(let skill of skills){
            if(skill_id == skill.system.skill_id){
              skill_found = true;
              const skillData = skill.toObject()
              if(skillData.type=="skill"){
                if(this.actor.type=="npc" && this.actor.system.level)skillData.system.rank=this.actor.system.level;
                else skillData.system.rank=1;
              }
              const created_skills = await this.actor.createEmbeddedDocuments("Item", [skillData]);
              ui.notifications.info(`Added skill ${skillData.name} to ${this.actor.name}.`);
              itemData.system.skill = created_skills[0].id;
              break;
            }
          }
        }
      }
    }

    if(itemData.type=="skill"){
      if(this.actor.type=="npc" && this.actor.system.level)itemData.system.rank=this.actor.system.level;
      else itemData.system.rank=1;
    }

    await this.actor.createEmbeddedDocuments("Item", [itemData]);

    ui.notifications.info(`Added ${itemData.name} to ${this.actor.name}.`);

    // if(item.type=="ability")this.add_ability(item.system);
    // else if(item.type=="equipment")this.add_equipment(item.system);
    // else if(item.type=="skill")this.add_skill(item.system);
  }


}
