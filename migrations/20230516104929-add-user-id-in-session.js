'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if the userId column exists before attempting to add it
    const tableInfo = await queryInterface.describeTable('Sports');
    if (!tableInfo['userId']) {
      await queryInterface.addColumn('Sports', 'userId', {
        type: Sequelize.DataTypes.INTEGER
      });

      await queryInterface.addConstraint('Sports', {
        fields: ['userId'],
        type: 'foreign key',
        references: {
          table: 'Users',
          field: 'id'
        }
      });
    }
  },

  async down(queryInterface, Sequelize) {
    // Remove the userId column from the Sports table in the down function
    await queryInterface.removeColumn('Sports', 'userId');
  }
};
