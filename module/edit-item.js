const stat_choices = {
  "strength": {name:"Strength"},
  "agility": {name:"Agility"},
  "intelligence": {name:"Intelligence"},
  "intuition": {name:"Intuition"},
}

const defense_choices = {
  "none": {name:"None"},
  "strength": {name:"Strength"},
  "agility": {name:"Agility"},
  "intelligence": {name:"Intelligence"},
  "intuition": {name:"Intuition"},
}

const action_choices = {
  "none": {name:"None"},
  "fast": {name:"Fast"},
  "medium": {name:"Medium"},
  "slow": {name:"Slow"},
}

const range_choices = {
  "none": {name:"None/Other"},
  "adjacent": {name:"Adjacent"},
  "close": {name:"Close"},
  "short": {name:"Short"},
  "long": {name:"Long"},
  "very_long": {name:"Very Long"},
}

const hands_choices = {
  "1h": {name:"One-handed"},
  "2h": {name:"Two-handed"},
}

const costtype_choices = {
  "none": {name:"None"},
  "vigour": {name:"Vigour"},
  "vim": {name:"Vim"},
  "steam": {name:"Steam"},
}

const skill_stat_choices = {
  "strength": {name:"Strength"},
  "agility": {name:"Agility"},
  "intelligence": {name:"Intelligence"},
  "intuition": {name:"Intuition"},
  "weapon": {name:"Weapon"},
  "none": {name:"None"},
}

const ability_type_choices = {
  "ability": {name:"Ability"},
  "weapon": {name:"Weapon Technique (weapon properties override empty fields)"}
}

export class VentureItemSheet extends ItemSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["venture-rpg", "sheet", "item"],
      template: "systems/venture-rpg/templates/edit-item.html",
      width: 600,
      height: 600,
      title: "Edit"
    });
  }

  getData(options){
    const context = super.getData(options);
    context.system = this.item.system;
    context.stat_choices = stat_choices;
    context.action_choices = action_choices;
    context.range_choices = range_choices;
    context.defense_choices = defense_choices;
    context.hands_choices = hands_choices;
    context.costtype_choices = costtype_choices;
    context.skill_stat_choices = skill_stat_choices;
    context.ability_type_choices = ability_type_choices;

    switch(this.item.type){
      case "skill":
        context.fields=[
          "name",
          "rank",
          "skill_stat",
          "is_combat",
          "description",
        ];
        break;
      case "ability":
        context.fields=[
          "name",
          "skill",
          "rank",
          "ability_type",
          "action",
          "cost",
          "range",
          "defense",
          "roll_type",
          "description",
        ];
        break;
      case "weapon":
        context.fields=[
          "name",
          "price",
          "rank",
          "action",
          "stat",
          "hands",
          "range",
          "defense",
          "roll_type",
          "description",
        ];
        break;
      case "equipment":
        context.fields=[
          "name",
          "price",
          "rank",
          "action",
          "description",
        ];
        break;
      case "species":
        context.fields=[
          "name",
          "bonus_stat",
          "community",
          "ability",
          "description",
        ];
        break;
      case "background":
        context.fields=[
          "name",
          "ability",
          "description",
        ];
        break;
      default:
        context_fields=[
          "name",
          "description",
        ];
    }
    console.log(context.fields);

    return context;
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find(".confirm").click(ev => {
      ev.preventDefault();
      this.close();
    });
  }
}

Hooks.once("init", () => {
  console.log("registering our item sheet")
  // Unregister core item sheet
  foundry.documents.collections.Items.unregisterSheet("core", ItemSheet);
  // Register our custom sheet as default
  foundry.documents.collections.Items.registerSheet("venture-rpg", VentureItemSheet, { makeDefault: true });
});


