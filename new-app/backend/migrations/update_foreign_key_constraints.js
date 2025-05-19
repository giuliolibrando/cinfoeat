const { Sequelize } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First drop the existing foreign key constraint
    await queryInterface.sequelize.query(
      'ALTER TABLE `user_choices` DROP FOREIGN KEY `user_choices_ibfk_1`;'
    );
    
    // Then recreate it with ON DELETE CASCADE
    await queryInterface.sequelize.query(
      'ALTER TABLE `user_choices` ADD CONSTRAINT `user_choices_ibfk_1` FOREIGN KEY (`option_id`) REFERENCES `menu_options` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;'
    );
    
    console.log('Migration completed: Foreign key constraint updated to ON DELETE CASCADE');
    return Promise.resolve();
  },

  down: async (queryInterface, Sequelize) => {
    // Revert back to the original constraint
    await queryInterface.sequelize.query(
      'ALTER TABLE `user_choices` DROP FOREIGN KEY `user_choices_ibfk_1`;'
    );
    
    await queryInterface.sequelize.query(
      'ALTER TABLE `user_choices` ADD CONSTRAINT `user_choices_ibfk_1` FOREIGN KEY (`option_id`) REFERENCES `menu_options` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;'
    );
    
    console.log('Migration reverted: Foreign key constraint restored to ON DELETE NO ACTION');
    return Promise.resolve();
  }
}; 