import {VALUE_TO_DIE, rollSkill} from "./rolling.js"

export class DiceAdjustMenu extends Application {
  constructor(name, d1, d2, d3=-1, options={}) {
    super(options);
    this.name = name;
    this.d1 = d1;
    this.d2 = d2;
    this.d3 = d3;
  }

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["venture-rpg", "dice-adjust-menu"],
      template: "systems/venture-rpg/templates/dice-adjust-menu.html",
      width: 300,
      height: "auto",
      title: "Adjust Dice"
    });
  }

  getData() {
    return {
      name: this.name,
      d1: this.d1,
      d2: this.d2,
      d3: this.d3
    };
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find(".confirm").click(ev => {
      ev.preventDefault();
      console.log(`Rolling ${this.name} with d${this.d1} and d${this.d2}`);
      rollSkill(this.name,this.d1,this.d2,this.d3);
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

