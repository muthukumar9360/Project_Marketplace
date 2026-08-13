const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  slug: { type: String, required: true },
  title: { type: String, required: true },
  shortDescription: { type: String, default: '' },
  fullDescription: { type: String, default: '' },
  price: { type: mongoose.Schema.Types.Mixed, default: 0 }, // can be number or 'Free'
  category: { type: String, default: 'Software' },
  technologies: { type: [String], default: [] },
  features: { type: [String], default: [] },
  tags: { type: [String], default: [] },
  keywords: { type: [String], default: [] },
  screenshots: { type: [String], default: [] },
  github: {
    owner: String,
    repository: String,
    languages: [String],
    lastUpdate: String
  },
  zipPath: { type: String, default: '' },
  isGitHubOnly: { type: Boolean, default: false },
  githubUrl: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Project', ProjectSchema);
