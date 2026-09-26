"use strict";

module.exports = {
  async up(queryInterface) {
    // Units of measure
    await queryInterface.bulkInsert("units_of_measure", [
      { name: "Piece", abbreviation: "pcs", created_at: new Date() },
      { name: "Kilogram", abbreviation: "kg", created_at: new Date() },
      { name: "Litre", abbreviation: "L", created_at: new Date() },
      { name: "Box", abbreviation: "box", created_at: new Date() },
      { name: "Carton", abbreviation: "ctn", created_at: new Date() },
      { name: "Metre", abbreviation: "m", created_at: new Date() },
      { name: "Gram", abbreviation: "g", created_at: new Date() },
    ]);

    // Default category so the first product can be created
    await queryInterface.bulkInsert("categories", [
      { name: "General", parent_id: null, created_at: new Date(), updated_at: new Date() },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("categories", { name: "General" });
    await queryInterface.bulkDelete("units_of_measure", null);
  },
};
