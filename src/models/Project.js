const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Project category is required'],
      trim: true,
    },
    year: {
      type: String,
      required: [true, 'Project year is required'],
      match: [/^\d{4}$/, 'Year must be a 4-digit number'],
      trim: true,
    },
    link: {
      type: String,
      required: [true, 'Project link is required'],
      trim: true,
    },
    image: {
      type: String,
      required: [true, 'Image path is required'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;
