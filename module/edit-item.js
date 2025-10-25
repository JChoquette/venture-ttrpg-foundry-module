export class VentureItemSheet extends ItemSheet {

  // constructor(actor, item, item_type, options={}) {
  //   super(options);
  //   this.actor = actor;
  //   this.item = item;
  //   this.item_type = item_type;
  //   this.options.title = "Edit "+item.name;
  // }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["venture-rpg", "sheet", "item"],
      template: "systems/venture-rpg/templates/edit-item.html",
      width: 600,
      height: "auto",
      title: "Edit"
    });
  }

  getData(){
    const context = super.getData(options);
    const itemData = this.item.system;
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find(".confirm").click(ev => {
      ev.preventDefault();
      this.close();
    });
  }
}

