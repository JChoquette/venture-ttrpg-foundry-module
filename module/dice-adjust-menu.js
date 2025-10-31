import {VALUE_TO_DIE, rollSkill} from "./rolling.js"

export class DiceAdjustMenu extends Application {
  constructor(actor, name, d1, d2, d3=-1, options={}) {
    super(options);
    this.actor=actor;
    this.name = name;
    this.d1_initial = d1;
    this.d2_initial = d2;
    this.d3_initial = d3;
    this.d1 = d1;
    this.d2 = d2;
    this.d3 = d3;

    this.options.title = "Rolling "+name;
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["venture-rpg", "dice-adjust-menu"],
      template: "systems/venture-rpg/templates/dice-adjust-menu.html",
      width: 300,
      height: "auto",
      title: "Rolling"
    });
  }

  getData() {
    //Check if each increment on each die should be active or not
    /** Rules:
     * Boons cannot be applied to d1 if banes are applied to d2, and vice versa
     * Banes cannot be applied to d1 if boons are applied to d2, and vice versa
     * Epic boons cannot be applied to d1 or d2 if any banes or boons are applied to the other
     * Dice cannot go below -1 (not present) or above 6 (d20)
     */

    let [d1, d2, d3] = [this.d1, this.d2, this.d3];
    let [d1i, d2i, d3i] = [this.d1_initial, this.d2_initial, this.d3_initial];
    let [d1b, d2b, d3b] = [d1-d1i, d2-d2i, d3-d3i];
    let enabled = {
      d1: {up:true, down:true},
      d2: {up:true, down:true},
      d3: {up:true, down:true},
    }

    //between -1 and 6
    for (let key in enabled){
      if (this[key] <= -1) enabled[key]["down"]=false;
      if (this[key] >= 6) enabled[key]["up"]=false;
    }

    //No epic boons with other boons/banes
    if (d1 == 6) enabled.d2 = {up:false, down:false};
    if (d2 == 6) enabled.d1 = {up:false, down:false};
    if (d1b != 0 && d2 == 5) enabled.d2.up = false;
    if (d2b != 0 && d1 == 5) enabled.d1.up = false;

    //No mixing boons/banes
    if (d1b > 0 && d2b == 0) enabled.d2.down = false;
    if (d1b < 0 && d2b == 0) enabled.d2.up = false;
    if (d2b > 0 && d1b == 0) enabled.d1.down = false;
    if (d2b < 0 && d1b == 0) enabled.d1.up = false;

    let boons=0;
    if (d1 == -1 && d2 == -1) boons = d3b;
    else boons = d1b + d2b;
    this.boons = boons;
    this.epic = (d1==6 || d2==6);

    return {
      name: this.name,
      d1: this.d1,
      d2: this.d2,
      d3: this.d3,
      enabled:enabled,
      boons: this.boons,
      epic: this.epic
    };
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find(".confirm").click(ev => {
      ev.preventDefault();
      console.log(`Rolling ${this.name} with d${this.d1} and d${this.d2}`);
      rollSkill(this.actor,this.name,this.d1,this.d2,this.d3,{boons:this.boons,epic:this.epic});
      this.close();
    });

    //activate increment/decrement dice buttons
    html.find(".increment-button").click(ev => {
      ev.preventDefault();
      const amount = $(ev.currentTarget).data("amount");
      const field = $(ev.currentTarget).data("field");
      this[field] = this[field] + parseInt(amount);
      this.render();
    });
  }
}

