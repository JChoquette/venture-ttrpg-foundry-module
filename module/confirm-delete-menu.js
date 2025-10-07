export class ConfirmDeleteMenu extends Application {
  constructor(actor, name, type, key, options={}) {
    super(options);
    this.name = name;
    this.type = type;
    this.key = key;
    this.actor = actor;
  }

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["venture-rpg", "confirm-delete-menu"],
      template: "systems/venture-rpg/templates/confirm-delete-menu.html",
      width: 200,
      height: "auto",
      title: "Confirm Delete"
    });
  }

  getData() {
    return {
      name: this.name,
      key: this.key,
      type: this.type
    }
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find(".confirm").click(ev => {
      ev.preventDefault();
      // Delete the item
      let new_value = {};
      new_value["system."+this.type+".-="+this.key] = null;
      this.actor.update(new_value);
      this.close();
    });
  }
}
