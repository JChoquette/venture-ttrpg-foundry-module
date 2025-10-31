import {jarnToWealth, wealthToJarn} from "../module.js";
import {VALUE_TO_DIE} from "./rolling.js";

export class SpendWealthMenu extends Application {
  constructor(actor, options={}) {
    super(options);
    this.actor=actor;
    this.wealth=1;
    this.jarn=wealthToJarn(this.wealth);
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["venture-rpg", "wealth-menu"],
      template: "systems/venture-rpg/templates/spend-wealth-menu.html",
      width: 300,
      height: "auto",
      title: "Spend Wealth"
    });
  }

  getData() {
    console.log(this);
    return {
      wealth:this.wealth,
      jarn:this.jarn,
      price_diff:Math.min((this.actor.system.wealth || 0) - this.wealth,6),
      actor_wealth:this.actor.system.wealth || 0,
    }
  }

  async spendWealth(actor,price){
    let track = parseInt(actor.system.wealth_track) || 0;
    let wealth = parseInt(actor.system.wealth) || 0;
    const price_diff = Math.min(wealth - price,6);
    const dice = VALUE_TO_DIE[price_diff] || 'd20';
    const roll = new Roll(`2${dice}`);
    await roll.evaluate({async:true});
    let message = "wealth not reduced";
    if(roll.total<5){
      wealth --;
      message = "wealth reduced";
    }
    roll.toMessage({
      speaker: ChatMessage.getSpeaker({actor}),
      flavor: `Rolled for purchase (${message})`
    })
    while(track >= wealth){
      track-=wealth;
      wealth++;
    }
    actor.update({"system.wealth":wealth,"system.wealth_track":track});
  }

  activateListeners(html) {
    super.activateListeners(html);

    html.find(".confirm").click(ev => {
      ev.preventDefault();
      this.spendWealth(this.actor,this.wealth);
      this.close();
    });


    html.find(".wealth-input").on("change",ev => {
      ev.preventDefault();
      const newval = ev.currentTarget.value;
      this.wealth=newval;
      this.jarn = wealthToJarn(newval);
      this.render();
    });


    html.find(".jarn-input").on("change",ev => {
      ev.preventDefault();
      const newval = ev.currentTarget.value;
      this.jarn=newval;
      this.wealth = jarnToWealth(newval);
      this.render();
    });
  }
}

