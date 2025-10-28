export class ConfirmDeleteMenu extends Application {
  constructor(actor, item, options={}) {
    super(options);
    this.actor = actor;
    this.item = item;
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["venture-rpg", "confirm-delete-menu"],
      template: "systems/venture-rpg/templates/confirm-delete-menu.html",
      width: 200,
      height: "auto",
      title: "Confirm Delete"
    });
  }

  getData() {
    return {
      item: this.item,
    }
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find(".confirm").click(ev => {
      ev.preventDefault();
      // Delete the item
      this.item.delete();
      this.close();
    });
  }
}
