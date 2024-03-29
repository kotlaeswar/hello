'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Sport extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Sport.init({
    title: DataTypes.STRING,
    date: DataTypes.DATE,
    time: DataTypes.TIME,
    players: DataTypes.STRING,
    location: DataTypes.STRING,
    additional: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Sport',
  });
  return Sport;
};