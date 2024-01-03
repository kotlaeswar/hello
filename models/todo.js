"use strict";
const { Model, Sequelize } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Todo extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The models/index file will call this method automatically.
     */
    static async addTask(params) {
      return await Todo.create(params);
    }
    static async showList() {
      console.log("My Todo list \n");

      console.log("Overdue");
      // FILL IN HERE
      var overdues = await Todo.overdue();
      overdues.forEach((item) => console.log(item.displayableString()));
      console.log("\n");

      console.log("Due Today");
      // FILL IN HERE
      let itemsDueToday = await Todo.dueToday();
      itemsDueToday.forEach((item) => console.log(item.displayableString()));
      console.log("\n");

      console.log("Due Later");
      // FILL IN HERE
      let itemsDueLater = await Todo.dueLater();
      itemsDueLater.forEach((item) => console.log(item.displayableString()));
    }

    static async overdue() {
      // FILL IN HERE TO RETURN OVERDUE ITEMS
      const today = new Date().toISOString().split("T")[0];
      return await Todo.findAll({
        where: {
          dueDate: { [Sequelize.Op.lt]: today },
        },
      });
    }

    static async dueToday() {
      // FILL IN HERE TO RETURN ITEMS DUE tODAY
      const today = new Date().toISOString().split("T")[0];
      return await Todo.findAll({
        where: {
          dueDate: today,
        },
      });
    }

    static async dueLater() {
      // FILL IN HERE TO RETURN ITEMS DUE LATER
      const today = new Date().toISOString().split("T")[0];
      return await Todo.findAll({
        where: {
          dueDate: { [Sequelize.Op.gt]: today },
        },
      });
    }

    static async markAsComplete(id) {
      try {
        const todo = await Todo.update(
          { completed: true },
          {
            where: {
              id: id,
            },
          }
        );

        console.log(todo.displayableString());
      } catch (error) {
        console.error(error);
      }
    }
    static associate(models) {
      // define association here
    }
    displayableString() {
      let checkbox = this.completed ? "[x]" : "[ ]";
      const dueDate =
        this.dueDate !== new Date().toISOString().split("T")[0]
          ? ` ${this.dueDate}`
          : "";
      return `${this.id} .${checkbox} ${this.title} ${dueDate}`;
    }
  }
  Todo.init(
    {
      title: DataTypes.STRING,
      dueDate: DataTypes.DATEONLY,
      completed: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "Todo",
    }
  );
  return Todo;
};