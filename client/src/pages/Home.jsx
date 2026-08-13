import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProjects } from '../services/api';
import { siteConfig } from '../config/siteConfig';

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('price-desc');
  const [publishedProjects, setPublishedProjects] = useState([]);
  const [githubRepos, setGithubRepos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Fetch published marketplace projects (ones with prices and ZIPs)
    getProjects()
      .then(setPublishedProjects)
      .catch(console.error);

    // 2. Fetch all public GitHub repositories directly
    const githubProfile = import.meta.env.VITE_GITHUB_PROFILE || 'https://github.com/muthukumar9360';
    const username = githubProfile.split('/').pop() || 'muthukumar9360';
    
    fetch(`https://api.github.com/users/${username}/repos?type=public&sort=updated`)
      .then(res => res.json())
      .then(repos => {
        if (Array.isArray(repos)) {
          setGithubRepos(repos);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const allProjects = useMemo(() => {
    // Combine published projects with public repos
    // If a public repo is already published, use the published data (has price, etc.)
    const publishedIds = new Set(publishedProjects.map(p => p.id));
    
    const unmappedRepos = githubRepos
      .filter(repo => !publishedIds.has(repo.name))
      .map(repo => ({
        id: repo.name,
        slug: repo.name.toLowerCase(),
        title: repo.name,
        shortDescription: repo.description || 'No description available.',
        price: 'Free',
        isGitHubOnly: true, // Flag to identify standard github repos
        githubUrl: repo.html_url,
        technologies: repo.language ? [repo.language] : [],
        tags: repo.topics || [],
      }));
      
    return [...publishedProjects, ...unmappedRepos];
  }, [publishedProjects, githubRepos]);

  const filteredProjects = useMemo(() => {
    // 1. Filter
    const term = searchTerm.toLowerCase();
    let result = allProjects;
    if (term) {
      result = allProjects.filter(p => 
        p.title.toLowerCase().includes(term) ||
        (p.shortDescription && p.shortDescription.toLowerCase().includes(term)) ||
        (p.technologies && p.technologies.some(t => t.toLowerCase().includes(term))) ||
        (p.tags && p.tags.some(t => t.toLowerCase().includes(term)))
      );
    }
    
    // 2. Sort
    return [...result].sort((a, b) => {
      const getPrice = (p) => p.price === 'Free' ? 0 : Number(p.price);

      if (sortOption === 'price-asc') {
        return getPrice(a) - getPrice(b);
      } else if (sortOption === 'price-desc') {
        return getPrice(b) - getPrice(a);
      } else if (sortOption === 'recent') {
        const dateA = a.github?.lastUpdate ? new Date(a.github.lastUpdate).getTime() : 0;
        const dateB = b.github?.lastUpdate ? new Date(b.github.lastUpdate).getTime() : 0;
        return dateB - dateA;
      }
      
      // 'default' sort:
      // Priority 1: Prioritize projects that have a valid description
      const aHasDesc = a.shortDescription && a.shortDescription !== 'No description available.';
      const bHasDesc = b.shortDescription && b.shortDescription !== 'No description available.';
      
      if (aHasDesc && !bHasDesc) return -1;
      if (!aHasDesc && bHasDesc) return 1;
      
      // Priority 2: Prioritize projects that have an amount (price)
      const aHasAmount = a.price !== 'Free';
      const bHasAmount = b.price !== 'Free';
      
      if (aHasAmount && !bHasAmount) return -1;
      if (!aHasAmount && bHasAmount) return 1;
      
      return 0; // Keep original order if both criteria are equal
    });
  }, [searchTerm, allProjects, sortOption]);

  return (
    <div className="w-full px-4 md:px-8 pt-8">
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto mb-4">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white">
          Ready-to-Use <span className="text-blue-500">Software Projects</span>
        </h1>
        <p className="text-lg text-slate-400 mb-8">
          Explore projects with source code, features, technology details & direct purchase options.
        </p>
      </div>

      {/* Search Bar & Filters */}
      <div className="max-w-4xl mx-auto mb-12 flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <input 
            type="text" 
            placeholder="Search projects, technologies, features..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          <svg className="w-6 h-6 text-slate-400 absolute left-4 top-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        <div className="relative min-w-[220px] shrink-0 group">
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="w-full appearance-none bg-slate-800/80 backdrop-blur-sm border border-slate-700 group-hover:border-slate-500 rounded-2xl py-4 pl-6 pr-12 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer font-medium shadow-lg shadow-slate-900/40"
          >
            <option value="price-desc" className="bg-slate-800 text-white py-2">Amount: High to Low</option>
            <option value="price-asc" className="bg-slate-800 text-white py-2">Amount: Low to High</option>
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-blue-400 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Project Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredProjects.map(project => (
          <div key={project.id} className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden hover:border-slate-600 transition-colors group flex flex-col">
            <div className="h-48 overflow-hidden bg-slate-900 relative border-b border-slate-700/50">
              <img 
                src={`https://socialify.git.ci/${(siteConfig.githubProfile.includes('developer') ? 'muthukumar9360' : siteConfig.githubProfile.split('/').pop())}/${project.github?.repository || project.id}/image?font=Inter&name=1&owner=1&theme=Light`} 
                alt={project.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><rect width="800" height="600" fill="%230f172a"/><text x="400" y="300" font-family="sans-serif" font-size="20" fill="%23475569" text-anchor="middle" dominant-baseline="middle">Screenshot not available</text></svg>`;
                }}
              />
            </div>
            <div className="p-6 flex-grow flex flex-col">
              <h3 className="text-xl font-bold text-white mb-2">{project.title}</h3>
              <p className="text-white text-sm mb-2 mt-2 flex-grow line-clamp-3">{project.shortDescription}</p>
              
              <div className="pt-6 border-t border-slate-700/50">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-white text-2xl font-medium uppercase tracking-wider">Price</span>
                  <span className={`font-bold ${project.price === 'Free' ? 'text-white text-sm' : 'text-blue-400 text-4xl'}`}>
                    {project.price === 'Free' ? 'Not specified' : `₹${project.price}`}
                  </span>
                </div>
                
                <Link to={`/projects/${project.slug}`} className="w-full flex justify-center items-center gap-2 bg-slate-700 hover:bg-blue-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-blue-500/25">
                  View Project
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </Link>
              </div>
            </div>
          </div>
        ))}
        {filteredProjects.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-400">
            No projects found matching your search.
          </div>
        )}
      </div>
    </div>
  );
}
