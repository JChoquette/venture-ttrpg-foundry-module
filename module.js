// module.js
import {InitiativeMenu} from "./module/initiative-menu.js";
import { VentureItemSheet } from "./module/edit-item.js";
import { VentureActor } from "./module/venture-actor.js";

const pathTemplate = "systems/venture-rpg/templates/";
const pathSheetParts = pathTemplate+"sheet-parts/";
const pathComponents = pathSheetParts+"components/";

export const actionValues = {
  "fast":2,
  "medium":3,
  "slow":6,
  "reaction":1,
}

export const getDiceForSkill = function(skill){
  if(!skill.actor)return {d1:0,d2:0,d3:0};
  const actor_system = skill.actor.system;
  const skill_system = skill.system;
  let stat = skill_system.stat;
  if(stat == "weapon"){
    const equipped_weapon = skill.actor.items.get(skill.actor.system.equipped_weapon);
    stat = equipped_weapon?.system?.stat || "none";
  }
  if(stat!="none"){
    return {
      d1:skill_system.rank,
      d2:actor_system[stat] - actor_system[stat+"_burn"],
      d3:skill_system.rank,
    }
  }else{
    return {
      d1:skill_system.rank,
      d2:0,
      d3:skill_system.rank,
    }
  }
}

const getDiceForWeapon = function(weapon){
  if(!weapon.actor)return {d1:0,d2:0,d3:0};
  const actor_system = weapon.actor.system;
  const stat = weapon.system.stat;
  const stat_value = (actor_system[stat] - actor_system[stat+"_burn"]) || 0;
  let skill_value = 0;
  for(let skill of weapon.actor.items){
    if(skill.type=="skill"){
      if(skill.system.domain?.toLowerCase()=="combat" || skill.system.is_combat){
        if(skill.system.rank > skill_value)skill_value = skill.system.rank;
      }
    }
  }
  return {
    d1:skill_value.toString(),
    d2:stat_value,
    d3:skill_value.toString()
  }
}

const reloadAllBasicActions = async function(){
  const pack = game.packs.get("venture-rpg.venture-basic_actions");
  const abilities = await pack.getDocuments();
  const basicActions = abilities.filter(a=>a.system.skill_id=="basic_actions").map(ability=>ability.toObject());
  //pop the last one, it's a duplicate. Don't know why this happens.
  basicActions.pop();

  for(let actor of game.actors.filter(a=>a.type=="character" && a.id)){
    for(let item of actor.items){
      if(item.system.skill_id=="basic_actions"){
        item.delete();
      }
    }

    actor.createEmbeddedDocuments("Item",basicActions);
  }
}

const reloadBasicActionsForActor = async function(actor){
  const pack = game.packs.get("venture-rpg.venture-basic_actions");
  const abilities = await pack.getDocuments();
  const basicActions = abilities.map(ability=>ability.toObject());
  actor.createEmbeddedDocuments("Item",basicActions);
}

const wealthBase = {
  1:1,
  2:2.5,
  0:5,
}

export const wealthToJarn = function(wealth){
  wealth = parseInt(wealth);
  if(wealth==0)return 0;
  const base = wealthBase[wealth % 3];
  const exp = Math.floor((wealth+2)/3);
  return base*(10**exp);
}

export const jarnToWealth = function(jarn){
  jarn = parseInt(jarn);
  if(jarn == 0)return 0;
  if(jarn < 10)return 1;
  const exp = Math.ceil(Math.log10(jarn));
  const prefactor = jarn/(10**(exp-1));
  let base;
  if(prefactor>5){
    base = 1;
  }else if(prefactor > 2.5){
    base = 0;
  }else base = -1;
  return 3*(exp-1)+base;
}

/**
 * System initialization
 */
Hooks.once("init", () => {
  console.log("Venture RPG | Initializing system");

  //Use our custom actor class
  CONFIG.Actor.documentClass = VentureActor;

  //preload templates
  preloadHandlebarsTemplates();

  // Example Handlebars helper: convert rank 1–5 into dice
  Handlebars.registerHelper("rankToDie", function(rank) {
    const dice = {
      0: "d1",   // for untrained or missing
      1: "d4",
      2: "d6",
      3: "d8",
      4: "d10",
      5: "d12",
      6: "d20"
    };
    return dice[rank] || "?";
  });

  //Create a block multiple times
  Handlebars.registerHelper("times", function(n, block) {
    let accum = "";
    for (let i = 0; i < n; ++i) {
      // expose the current index as @index, and i as the context
      accum += block.fn(i);
    }
    return accum;
  });
  //Custom each that keeps outside context
  Handlebars.registerHelper('forEach', function (array, block) {
    let out = '';
    for (let i = 0; i < array.length; i++) {
      out += block.fn({field: array[i], ...this});
    }
    return out;
  });


  Handlebars.registerHelper("getkey", function(obj,key){
    return obj[key];
  })
  Handlebars.registerHelper("getkeysafe", function(obj,key){
    if(!obj) return "";
    return obj[key];
  })

  Handlebars.registerHelper("subtract", function(a,b){
    return a - b;
  })

  Handlebars.registerHelper("gte", function(a,b){
    return a >= b;
  })

  Handlebars.registerHelper("eq", function(a,b){
    return a == b;
  })

  Handlebars.registerHelper("neq", function(a,b){
    return a != b;
  })

  Handlebars.registerHelper("or", function(a,b){
    return a || b;
  })
  Handlebars.registerHelper("and", function(a,b){
    return a && b;
  })

  Handlebars.registerHelper("dieImage", function(size) {
    return `systems/venture-rpg/assets/dice/${size}.svg`;
  });

  Handlebars.registerHelper("icons", function(icon) {
    return `systems/venture-rpg/assets/icons/${icon}.svg`;
  });

  Handlebars.registerHelper("component", function(name) {
    return pathComponents+name+".html";
  });
  Handlebars.registerHelper("sheet_part", function(name) {
    return pathSheetParts+name+".html";
  });

  //Used to send a list of data fields to a handlebars partial
  Handlebars.registerHelper("data_fields", function(...args){
    let data = [];
    for(let i=0;i<args.length;i=i+2){
      if(args[i+1]){
        data.push({
          field:args[i],
          value:args[i+1]
        });
      }
    }
    return data;
  });

  //Used to send either null or text based on a condtion
  Handlebars.registerHelper("iftext", function(condition,text){
    if(condition)return text;
  });

  Handlebars.registerHelper("actionToPercent", function(action, max_values) {
    return action/max_values*100;
  });


  Handlebars.registerHelper("getDiceForSkill", getDiceForSkill);

  Handlebars.registerHelper("getOverridesForAbility", function(ability){
    if(!ability.actor)return {};
    let weapon;
    let overrides = {action:ability.system.action,defense:ability.system.defense};
    if(ability.system.type == "weapon"){
      const equipped_weapon = ability.actor.items.get(ability.actor.system.equipped_weapon);
      if(equipped_weapon){
        if(!ability.system.action || ability.system.action == "none")overrides.action = equipped_weapon.system.action;
        if(!ability.system.defense || ability.system.defense == "none")overrides.defense = equipped_weapon.system.defense;
      }      
      //If we have an ability that has no skill but is weapon-based, the roll will be the player's highest combat skill
      if(ability.system.skill=="none" || ability.system.skill_id=="basic_actions"){
        overrides.name="Combat";
        if(equipped_weapon){
          overrides.dice = getDiceForWeapon(equipped_weapon);
        }
        return overrides;
      }
    }
    let skill;
    for(let item of ability.actor.items){
      if(item.id==ability.system.skill){
        return {
          skill:item.name,
          dice:getDiceForSkill(item),
          ...overrides
        }
      }
    }
    return {
      skill:"None",
      ...overrides
    }
  });

  Handlebars.registerHelper("getDiceForWeapon", getDiceForWeapon);

  Handlebars.registerHelper("getActorSkills", function(actor){
    let skills={"none":{"name":"None"}};
    for(let item of actor.items){
      if(item.type=="skill"){
        skills[item.id] = {
          "name":item.name,
        }
      }
    }
    return skills
  });

  Handlebars.registerHelper("getAbilityCostClass", function(ability){
    if(!ability.actor)return "disabled";
    const costtype = ability.system.costtype;
    const cost = ability.system.cost;
    if(!cost || !costtype)return "disabled";
    const max_res = ability.actor.system["max_"+costtype];
    const res_remaining = max_res - ability.actor.system[costtype];
    if(!max_res)return "too-expensive disabled";
    if(res_remaining < cost)return "too-expensive disabled";
    return "pay-cost";
  });
  Handlebars.registerHelper("getAbilityActionClass", function(ability, action_info, overrides={}){
    if(!action_info.in_combat)return "use-action";
    if(!ability.actor)return "disabled";
    const action = overrides.action || ability.system.action;
    if(!action || action == "none")return "disabled";
    if(action == "reaction"){
      if(action_info.reactions_used >= (action_info.max_reactions || 1))return "too-expensive disabled";
    }else if(actionValues[action] + action_info.actions_used > 6.01)return "too-expensive disabled";
    return "use-action";
  });

  //Money stuff!
  Handlebars.registerHelper("wealthToJarn",wealthToJarn);
  Handlebars.registerHelper("jarnToWealth",jarnToWealth);

});



export const preloadHandlebarsTemplates = async function() {
  const sheetParts = [
    "notes.html",
    "skills.html",
    "defenses.html",
    "resources.html",
    "wounds.html",
    "burn.html",
    "abilities.html",
    "equipment.html",
    "setup-stats-character.html",
    "setup-stats-npc.html",
    "setup-wounds.html",
    "setup-resources.html",
  ]
  const sheetComponents = [
    "icon-with-wrap.html"
  ]
  const templatePaths = sheetParts.map((x)=>pathSheetParts+x).concat(sheetComponents.map((x)=>pathComponents+x));
  return foundry.applications.handlebars.loadTemplates(templatePaths);
};

const venture_distances = [
  {name:"Adjacent",min:0,max:5,color:"#0000FF"},
  {name:"Close",min:5,max:10,color:"#00FFFF"},
  {name:"Short",min:10,max:25,color:"#00FF00"},
  {name:"Long",min:25,max:50,color:"#FFFF00"},
  {name:"Very Long",min:50,max:100,color:"#FF9900"},
  {name:"Out of range",min:100,max:9999,color:"#FF0000"},
]


//Alter the way the rulers display
Hooks.once("ready", () => {
  console.log("Readying the ruler hooks");

  const updateRulerPrototype = (RulerClass) => {

    const originalGetSegmentStyle = RulerClass.prototype._getSegmentStyle;

    RulerClass.prototype._getSegmentStyle = function(...args){
      const result = originalGetSegmentStyle.apply(this, args);
      const distance = args[0].measurement.distance;
      let dist;
      for(dist of venture_distances){
        if(dist.max > distance)break;
      }
      result.color = dist.color;
      return result;
    };

    const originalGetWayPointLabelContext = RulerClass.prototype._getWaypointLabelContext;

    RulerClass.prototype._getWaypointLabelContext = function(...args){
      const result = originalGetWayPointLabelContext.apply(this, args);
      if(!result)return result;
      const distance = parseInt(result.distance.total);
      let dist;
      for(dist of venture_distances){
        if(dist.max > distance)break;
      }
      result.distance.total = result.distance.total + " ("+dist.name+")";
      if(result.cost){
        const cost = parseInt(result.cost.total);
        for(dist of venture_distances){
          if(dist.max > cost)break;
        }
        result.cost.total = result.cost.total + " ("+dist.name+")";
      }
      return result;

    }
  }

  updateRulerPrototype(foundry.canvas.interaction.Ruler);
  updateRulerPrototype(foundry.canvas.placeables.tokens.TokenRuler);



  const TemplateClass = foundry.canvas.placeables.MeasuredTemplate;
  const originalFn = TemplateClass.prototype._refreshRulerText;
  TemplateClass.prototype._refreshRulerText = function(...args){
    const result = originalFn.apply(this,args);
    const distance = parseInt(this.ruler.text);
    let dist;
    for(dist of venture_distances){
      if(dist.max > distance)break;
    }
    this.ruler.text = this.ruler.text + " ("+dist.name+")";

    return result;
  }


});

//Scene defaults:
Hooks.on("preCreateScene", (scene, data, options, userId) => {
  scene.updateSource({
    grid:{
      type: CONST.GRID_TYPES.GRIDLESS,
      distance:2,
      units:"m",
      size:scene.grid.size ?? 100,
    }
  });
});
Hooks.on("ready", ()=>{
  const Document = foundry.documents.Scene;
  const originalImportFromJSON = Document.prototype.importFromJSON;
  Document.prototype.importFromJSON = async function (...args){
    const json = args[0]
    const parsedJSON = JSON.parse(json);
    parsedJSON.gridUnits = "m";
    parsedJSON.gridDistance = 2;
    parsedJSON.gridType = CONST.GRID_TYPES.GRIDLESS;
    args[0]=JSON.stringify(parsedJSON);
    return await originalImportFromJSON.apply(this,args);
  }
});


//Display tokens instead of actor images because I'm lazy
Hooks.on("renderActorDirectory", (app, html, data) => {
  $(html).find(".directory-item").each((i, el) => {
    const actor = game.actors.get($(el).data("entry-id"));
    if(!actor) return;
    const tokenImg = actor.prototypeToken?.texture?.src;
    if(tokenImg){
      $(el).find("img.thumbnail").attr("src",tokenImg);
    }
  });
});


//Change how the initiative rolls work
Hooks.once("ready", () => {

  const CombatDocumentClass = foundry.documents.Combat;
  const originalRollInitiative = CombatDocumentClass.prototype.rollInitiative;
  CombatDocumentClass.prototype.rollInitiative = async function(ids, {formula=null, updateTurn=true, messageOptions={}}={}) {

    // Structure input data
    ids = typeof ids === "string" ? [ids] : ids;
    const chatRollMode = game.settings.get("core", "rollMode");

    // Iterate over Combatants, performing an initiative roll for each
    const updates = [];
    const messages = [];
    for ( const [i, id] of ids.entries() ) {

      // Get Combatant data (non-strictly)
      const combatant = this.combatants.get(id);
      if ( !combatant?.isOwner ) continue;

      // Produce an initiative roll for the Combatant
      const formula = await new Promise((resolve) => {
        new InitiativeMenu(combatant.actor, resolve).render(true);
      }); 
      const roll = combatant.getInitiativeRoll(formula);
      await roll.evaluate();
      updates.push({_id: id, initiative: roll.total});

      // If the combatant is hidden, use a private roll unless an alternative rollMode was explicitly requested
      const rollMode = "rollMode" in messageOptions ? messageOptions.rollMode
        : (combatant.hidden ? CONST.DICE_ROLL_MODES.PRIVATE : chatRollMode);

      // Construct chat message data
      const messageData = foundry.utils.mergeObject({
        speaker: foundry.documents.ChatMessage.implementation.getSpeaker({
          actor: combatant.actor,
          token: combatant.token,
          alias: combatant.name
        }),
        flavor: game.i18n.format("COMBAT.RollsInitiative", {name: foundry.utils.escapeHTML(combatant.name)}),
        flags: {"core.initiativeRoll": true}
      }, messageOptions);
      const chatData = await roll.toMessage(messageData, {rollMode, create: false});

      // Play 1 sound for the whole rolled set
      if ( i > 0 ) chatData.sound = null;
      messages.push(chatData);
    }
    if ( !updates.length ) return this;

    // Update combatants and combat turn
    const updateOptions = { turnEvents: false };
    if ( !updateTurn ) updateOptions.combatTurn = this.turn;
    await this.updateEmbeddedDocuments("Combatant", updates, updateOptions);

    // Create multiple chat messages
    await foundry.documents.ChatMessage.implementation.create(messages);
    return this;
  }

});

Hooks.on("createCombatant", async (combatant, data, options, userId) =>{
  await combatant.setFlag("venture-rpg","actionsUsed",0);
  await combatant.setFlag("venture-rpg","reactionsUsed",0);
});
Hooks.on("renderCombatTracker", async (app, html, data) =>{
  $(html).find(".combatant").each(async (i, el) =>{
    const id = el.dataset.combatantId;
    const combatant = game.combat?.combatants.get(id);
    const actor = game.actors.get(combatant.actorId);
    if(!combatant)return;

    const actionsUsed = combatant.getFlag("venture-rpg", "actionsUsed") ?? 0;
    const reactionsUsed = combatant.getFlag("venture-rpg", "reactionsUsed") ?? 0;
    const maxReactions = actor.system.max_reactions || 1.0;
    const actionIndicator = await foundry.applications.handlebars.renderTemplate("systems/venture-rpg/templates/combat/action-tracker.html", {
      actionsUsed,
      reactionsUsed,
      maxReactions,
    });

    if (!el.querySelector(".action-tracker")) {
      $(el).find(".token-initiative").after(actionIndicator);
    }

    $(el).find(".use-action:not(.disabled)").click(ev => {
      const action_type = $(ev.currentTarget).data("action");
      if(action_type=="reaction") combatant.setFlag("venture-rpg","reactionsUsed",combatant.getFlag("venture-rpg","reactionsUsed")+1);
      else combatant.setFlag("venture-rpg","actionsUsed",combatant.getFlag("venture-rpg","actionsUsed")+actionValues[action_type]);
    });
  });
});

Hooks.on("combatTurnChange", (combat, updateData, updateOptions) =>{
  const combatant = combat.combatants.get(updateOptions.combatantId);
  combatant.setFlag("venture-rpg","actionsUsed",0);
  combatant.setFlag("venture-rpg","reactionsUsed",0);
})

Hooks.on("renderCompendium", async (app, html, data)=>{

  // Load the full index (we’ll need system data)
  const documents = await app.collection.getIndex({fields:["system"]});

  // For each entry row
  $(html).find(".directory-item").each((i, li) => {
    const id = $(li).data("entry-id");
    //I don't know why foundry keeps adding extra entries
    if (!id)$(li).remove();
    const entry = documents.get(id);
    if (!entry) return;

    const price = entry.system?.price ?? "—";
    const category = entry.system?.category ?? "—";
    const skill = entry.system?.skill ?? "—";
    const rank = entry.system?.rank ?? "—";

    // Append custom info
    let info;
    if(entry.type=="ability")info = $(`<div class="compendium-item-meta"><span>${skill}</span> <span>${rank}:</span></div>`);
    if(entry.type=="equipment")info = $(`<div class="compendium-item-meta"><span>${category}</span> <span>${rank}:</span></div>`);
    if(entry.type=="weapon")info = $(`<div class="compendium-item-meta"><span>${category}</span> <span>${rank}:</span></div>`);
    if(entry.type=="skill")info=$(`<div class="compendium-item-meta"><span>Skill:</span></div>`);
    $(li).find(".entry-name").before(info);
  });

  const sortedEntries = Array.from(documents.values()).sort((a, b) => {
    const skillA = (a.system?.skill ?? "").toLowerCase();
    const skillB = (b.system?.skill ?? "").toLowerCase();
    if (skillA !== skillB) return skillA.localeCompare(skillB);

    const categoryA = (a.system?.category ?? "").toLowerCase();
    const categoryB = (b.system?.category ?? "").toLowerCase();
    if (categoryA !== categoryB) return categoryA.localeCompare(categoryB);

    const rankA = a.system?.rank ?? 0;
    const rankB = b.system?.rank ?? 0;
    if (rankA !== rankB)return rankA - rankB;

    const nameA = (a.name ?? "").toLowerCase();
    const nameB = (b.name ?? "").toLowerCase();
    return nameA.localeCompare(nameB);
  });

  // Build a map of id → sorted position
  const orderMap = new Map(sortedEntries.map((e, i) => [e._id, i]));

  // Sort the DOM elements based on that
  const list = $(html).find(".directory-list");
  const items = list.children(".directory-item").get();

  items.sort((a, b) => {
    const posA = orderMap.get($(a).data("entry-id")) ?? 0;
    const posB = orderMap.get($(b).data("entry-id")) ?? 0;
    return posA - posB;
  });

  // Re-append in sorted order
  list.append(items);
});

//Add the basic actions onto characters
Hooks.on("ready", async ()=>{
  if(!game.user.isGM) return;
  reloadAllBasicActions();
});

//Add the basic actions to newly created characters
Hooks.on("createActor", async (actor, options, userId) => {
  if (actor.type !== "character") return;
  reloadBasicActionsForActor(actor);
  //Add unarmed as a weapon
  const pack = game.packs.get("venture-rpg.venture-armourer-weapons");
  const weapons = await pack.getDocuments();
  const unarmed = weapons.find(a=>a.name=="Unarmed");
  if(unarmed)actor.createEmbeddedDocuments("Item",[unarmed.toObject()]);
});