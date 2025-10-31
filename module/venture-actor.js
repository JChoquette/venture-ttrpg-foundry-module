export class VentureActor extends Actor {

  /** @override */
  prepareDerivedData() {
    super.prepareDerivedData();

    const system = this.system;

    // base stats
    const baseStats = [
      "strength", 
      "agility", 
      "intelligence", 
      "intuition",
      "endurance",
      "fuel"
    ];

    // Make sure derived data exists
    system.derived = system.derived || {};

    // Loop through each stat and compute final values
    for (const stat of baseStats) {
      let value = this.getStat(stat);
      if(baseStats.indexOf(stat)<=3 && value > 5)value=5;
      if(baseStats.indexOf(stat)<=4 && value < 1)value=1;
      system.derived[stat] = value;
      system.derived[stat+"_current"] = system.derived[stat] - (system[stat+"_burn"] || 0);
    }

    //Calculate all the derived values:
    //Resources
    system.derived["max_vigour"] = this.getVigour();
    system.derived["max_vim"] = this.getVim();
    system.derived["max_steam"] = this.getSteam();

    //Wounds
    system.derived["max_guard"] = this.getGuard();
    system.derived["max_minor_wounds"] = this.getMinorWounds();
    system.derived["max_major_wounds"] = this.getMajorWounds();
    system.derived["max_critical_wounds"] = this.getCriticalWounds();

    //Damage Thresholds
    system.derived["major_threshold"] = this.getMajorThreshold();
    system.derived["critical_threshold"] = this.getCriticalThreshold();
  }

  getStat(stat){
    let base = this.system[stat] || 0;
    if(this.type=="npc" && ! this.system[stat+"_is_custom"] && stat != "fuel")base=this.system.level || 1;
    return base + this._addModifiers(stat);
  }

  //Resources
  getVigour(){
    const base = this.system.derived["strength"]+this.system.derived["agility"];
    return base + this._addModifiers("vigour");
  }
  getVim(){
    const base = this.system.derived["intelligence"]+this.system.derived["intuition"];
    return base + this._addModifiers("vim");
  }
  getSteam(){
    const base = 0;
    return base + this._addModifiers("steam");
  }

  //Wounds
  getGuard(){
    //For now, use the input value as base, later base on equipped armour
    //TODO
    const base = this.system.max_guard;
    return base + this._addModifiers("guard");
  }
  getMinorWounds(){
    let base = this.system.level;
    if(this.type=="character")base = this.system.derived.endurance+1;
    return base + this._addModifiers("minor_wounds");
  }
  getMajorWounds(){
    let base = this.system.level;
    if(this.type=="character")base = this.system.derived.endurance+1;
    return base + this._addModifiers("major_wounds");
  }
  getCriticalWounds(){
    const base = 1;
    return base + this._addModifiers("critical_wounds");
  }

  getMajorThreshold(){
    let base;
    if(this.type=="npc") base = 4 + Math.floor((this.level ?? 0)/2);
    else base = 4 + Math.floor(this.system.derived.endurance/2);
    return base + this._addModifiers("major_threshold");
  }
  getCriticalThreshold(){
    let base;
    if(this.type=="npc") base = this.system.derived.major_threshold*2;
    else base = this.system.derived.major_threshold+10;
    return base + this._addModifiers("critical_threshold");
  }


  _addModifiers(stat){
    const modifiers = this._collectModifiers(stat);
    return modifiers.reduce((sum, mod) => sum + parseInt(mod.value), 0);
  }

  /**
   * Collect all modifiers from owned items that affect a given stat.
   * @param {string} stat - e.g. "strength"
   * @returns {Array<{target:string,value:number}>}
   */
  _collectModifiers(stat) {
    const mods = [];
    for (const item of this.items) {
      const itemMods = item.system?.modifiers ?? [];
      for (const mod of itemMods) {
        if (mod.target === stat) mods.push(mod);
      }
    }
    return mods;
  }
}