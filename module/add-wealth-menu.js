import {jarnToWealth, wealthToJarn} from "../module.js";

export class AddWealthMenu extends Application {
  constructor(actor, options={}) {
    super(options);
    this.actor=actor;
    this.wealth=1;
    this.jarn=wealthToJarn(this.wealth);
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["venture-rpg", "wealth-menu"],
      template: "systems/venture-rpg/templates/add-wealth-menu.html",
      width: 300,
      height: "auto",
      title: "Add Wealth"
    });
  }

  getData() {
    console.log(this);
    return {
      wealth:this.wealth,
      jarn:this.jarn,
    }
  }

  addWealth(actor,added){
    let track = parseInt(actor.system.wealth_track) || 0;
    let wealth = parseInt(actor.system.wealth) || 0;
    if(added > wealth){
      track += wealth;
      wealth = added;
    }else{
      track += added;
    }
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
      console.log("We should add some wealth:",this.wealth);
      this.addWealth(this.actor,this.wealth);
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

