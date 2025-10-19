// module.js

/**
 * System initialization
 */
Hooks.once("init", () => {
  console.log("Venture RPG | Initializing system");

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

  Handlebars.registerHelper("times", function(n, block) {
    let accum = "";
    for (let i = 0; i < n; ++i) {
      // expose the current index as @index, and i as the context
      accum += block.fn(i);
    }
    return accum;
  });

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
});

export const preloadHandlebarsTemplates = async function() {
  const templatePaths = [
    "systems/venture-rpg/templates/sheet-parts/notes.html",
    "systems/venture-rpg/templates/sheet-parts/skills.html",
    "systems/venture-rpg/templates/sheet-parts/defenses.html",
    "systems/venture-rpg/templates/sheet-parts/resources.html",
    "systems/venture-rpg/templates/sheet-parts/wounds.html",
    "systems/venture-rpg/templates/sheet-parts/burn.html",
    "systems/venture-rpg/templates/sheet-parts/abilities.html",
    "systems/venture-rpg/templates/sheet-parts/equipment.html",
    "systems/venture-rpg/templates/sheet-parts/setup-stats-character.html",
    "systems/venture-rpg/templates/sheet-parts/setup-stats-npc.html",
    "systems/venture-rpg/templates/sheet-parts/setup-wounds.html",
    "systems/venture-rpg/templates/sheet-parts/setup-resources.html",
    "systems/venture-rpg/templates/sheet-parts/setup-skills.html",
    "systems/venture-rpg/templates/sheet-parts/setup-abilities.html",
    "systems/venture-rpg/templates/sheet-parts/setup-equipment.html",
  ];
  return loadTemplates(templatePaths);
};