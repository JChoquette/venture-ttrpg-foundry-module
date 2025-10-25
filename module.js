// module.js
import {InitiativeMenu} from "./module/initiative-menu.js";
import { VentureItemSheet } from "./module/edit-item.js";

const pathTemplate = "systems/venture-rpg/templates/";
const pathSheetParts = pathTemplate+"sheet-parts/";
const pathComponents = pathSheetParts+"components/";

export const actionValues = {
  "fast":2,
  "medium":3,
  "slow":6,
  "reaction":1,
}

/**
 * System initialization
 */
Hooks.once("init", () => {
  console.log("Venture RPG | Initializing system");

  //preload templates
  preloadHandlebarsTemplates();

  // Unregister core item sheet
  Items.unregisterSheet("core", ItemSheet);
  // Register our custom sheet as default
  Items.registerSheet("venture-rpg", VentureItemSheet, { makeDefault: true });

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

  Handlebars.registerHelper("times", function(n, block) {
    let accum = "";
    for (let i = 0; i < n; ++i) {
      // expose the current index as @index, and i as the context
      accum += block.fn(i);
    }
    return accum;
  });


  Handlebars.registerHelper("getkey", function(obj,key){
    return obj[key];
  })

  Handlebars.registerHelper("subtract", function(a,b){
    return a - b;
  })

  Handlebars.registerHelper("gte", function(a,b){
    return a >= b;
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
    "setup-skills.html",
    "setup-abilities.html",
    "setup-equipment.html",
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