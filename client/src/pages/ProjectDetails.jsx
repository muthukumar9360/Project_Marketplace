import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { siteConfig } from '../config/siteConfig';
import { getProjects, getSettings } from '../services/api';

export default function ProjectDetails() {
  const { slug } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null);
  const [readmeHtml, setReadmeHtml] = useState('');

  useEffect(() => {
    Promise.all([getProjects(), getSettings()])
      .then(async ([data, settingsData]) => {
        setSettings(settingsData);
        let found = data.find(p => p.slug === slug || p.id === slug);
        if (!found) {
          const githubProfile = import.meta.env.VITE_GITHUB_PROFILE || 'https://github.com/muthukumar9360';
          const username = githubProfile.split('/').pop() || 'muthukumar9360';
          try {
            const res = await fetch(`https://api.github.com/repos/${username}/${slug}`);
            if (res.ok) {
              const repo = await res.json();
              found = {
                id: repo.name,
                slug: repo.name.toLowerCase(),
                title: repo.name,
                shortDescription: repo.description || 'No description available.',
                fullDescription: repo.description || 'No description available.',
                price: 'Free',
                category: 'Software',
                isGitHubOnly: true,
                githubUrl: repo.html_url,
                technologies: repo.language ? [repo.language] : [],
                features: [],
                tags: repo.topics || [],
                github: {
                  owner: repo.owner.login,
                  repository: repo.name,
                  languages: repo.language ? [repo.language] : [],
                  lastUpdate: new Date(repo.updated_at).toISOString().split('T')[0]
                }
              };
            }
          } catch (e) {
            console.error(e);
          }
        }
        
        // Fetch README if we have GitHub info
        if (found && (found.github || found.isGitHubOnly)) {
          const repoOwner = found.github?.owner || (settingsData?.githubProfile || import.meta.env.VITE_GITHUB_PROFILE || '').split('/').pop() || 'muthukumar9360';
          const repoName = found.github?.repository || found.id;
          
          try {
            const readmeRes = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/readme`, {
              headers: { 'Accept': 'application/vnd.github.v3.html' }
            });
            if (readmeRes.ok) {
              let html = await readmeRes.text();
              
              // Find 'git clone' followed by a URL/path and remove just the URL part
              html = html.replace(/git clone\s+[^<\s"']+/gi, 'git clone [URL HIDDEN]');
              
              setReadmeHtml(html);
            }
          } catch (e) {
            console.error('Failed to fetch README', e);
          }
        }

        setProject(found || null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="p-12 text-center text-white">Loading...</div>;
  if (!project) return <Navigate to="/" />;

  // Generate exactly 2 images for the snapshot gallery
  const galleryImages = [];
  if (project.screenshots && project.screenshots.length > 0) {
    galleryImages.push(...project.screenshots.slice(0, 2));
  }
  if (galleryImages.length < 2) {
    galleryImages.push(`https://loremflickr.com/800/600/${encodeURIComponent(project.technologies?.[0] || 'software')},code?random=1`);
  }
  if (galleryImages.length < 2) {
    galleryImages.push(`https://loremflickr.com/800/600/${encodeURIComponent(project.technologies?.[1] || project.category || 'technology')},programming?random=2`);
  }

  return (
    <div className="w-full px-4 md:px-8 py-8 md:py-12">
      <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-blue-400 transition-colors mb-8 font-medium">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        Back to Projects
      </Link>
      
      {/* Header */}
      <div className="mb-12 border-b border-slate-800 pb-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 mt-2">{project.title}</h1>
          <p className="text-xl text-slate-400 max-w-3xl mt-8">{project.shortDescription}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
        <div className="md:col-span-2 space-y-12">
          
          {/* Image */}
          <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl relative group">
              <img 
                src={`https://socialify.git.ci/${(siteConfig.githubProfile.includes('developer') ? 'muthukumar9360' : siteConfig.githubProfile.split('/').pop())}/${project.github?.repository || project.id}/image?font=Inter&name=1&owner=1&theme=Light`} 
                alt={project.title} 
                className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700" 
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="600" viewBox="0 0 1200 600"><rect width="1200" height="600" fill="%230f172a"/><text x="600" y="300" font-family="sans-serif" font-size="24" fill="%23475569" text-anchor="middle" dominant-baseline="middle">Screenshot not available</text></svg>`;
                }}
              />
          </div>

          {/* About */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">About the Project</h2>
            <div className="text-slate-300 leading-relaxed space-y-4">
              <p>{project.fullDescription}</p>
            </div>
          </section>

          {/* Problem Solved */}
          {project.problemSolved && (
            <section className="bg-slate-800/30 p-6 rounded-2xl border border-slate-800">
              <h2 className="text-xl font-bold text-white mb-3">Problem it Solves</h2>
              <p className="text-slate-300">{project.problemSolved}</p>
            </section>
          )}

          {/* Features */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Main Features</h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {project.features.map((feature, i) => (
                <li key={i} className="flex items-start">
                  <svg className="w-6 h-6 text-blue-500 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  <span className="text-slate-300">{feature}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* README */}
          {readmeHtml && (
            <section className="pt-8 border-t border-slate-800">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
                README.md
              </h2>
              <div 
                className="text-slate-300 leading-relaxed max-w-none 
                  [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:text-white [&_h1]:mb-6 [&_h1]:pb-2 [&_h1]:border-b [&_h1]:border-slate-800
                  [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-white [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:pb-2 [&_h2]:border-b [&_h2]:border-slate-800
                  [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-white [&_h3]:mt-8 [&_h3]:mb-3
                  [&_p]:mb-6 [&_p_code]:bg-slate-800 [&_p_code]:text-blue-300 [&_p_code]:px-1.5 [&_p_code]:py-0.5 [&_p_code]:rounded [&_p_code]:text-sm
                  [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-6 [&_ul_li]:mb-2
                  [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-6 [&_ol_li]:mb-2
                  [&_pre]:bg-slate-900 [&_pre]:border [&_pre]:border-slate-700 [&_pre]:p-4 [&_pre]:rounded-xl [&_pre]:overflow-x-auto [&_pre]:mb-6
                  [&_pre_code]:text-blue-300 [&_pre_code]:text-sm [&_pre_code]:font-mono
                  [&_blockquote]:border-l-4 [&_blockquote]:border-blue-500 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-slate-400 [&_blockquote]:mb-6
                  [&_a]:text-blue-400 [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-blue-300
                  [&_table]:w-full [&_table]:mb-6 [&_table]:border-collapse
                  [&_table_th]:border [&_table_th]:border-slate-700 [&_table_th]:px-4 [&_table_th]:py-3 [&_table_th]:bg-slate-800/50 [&_table_th]:text-white
                  [&_table_td]:border [&_table_td]:border-slate-700 [&_table_td]:px-4 [&_table_td]:py-3
                  [&_img]:max-w-full [&_img]:rounded-xl [&_img]:my-6 [&_img]:shadow-lg"
                dangerouslySetInnerHTML={{ __html: readmeHtml }} 
              />
            </section>
          )}

        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Purchase Box */}
          <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 text-center shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            
            <div className="text-sm text-slate-400 mb-2 uppercase tracking-widest font-bold">One-Time Purchase</div>
            
            <div className={`mb-6 ${project.price === 'Free' ? 'text-xl font-medium text-slate-400' : 'text-5xl font-extrabold bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent animate-pulse'}`}>
              {project.price === 'Free' ? 'Amount not specified' : `₹${project.price}`}
            </div>

            {project.price === 'Free' ? (
              <button 
                disabled
                className="block w-full bg-slate-700 text-slate-400 font-bold py-4 px-6 rounded-xl cursor-not-allowed border border-slate-600"
              >
                UNAVAILABLE
              </button>
            ) : (
              <Link 
                to={`/payment/${project.slug}`} 
                className="relative block w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] hover:-translate-y-1 overflow-hidden"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  BUY NOW
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </span>
              </Link>
            )}
          </div>

          {/* Tech Stack */}
          <section className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
            <h3 className="text-lg font-bold text-white mb-4">Technology Stack</h3>
            <div className="flex flex-wrap gap-2">
              {project.technologies.map(tech => (
                <span key={tech} className="bg-slate-900 text-slate-300 px-3 py-1.5 rounded-lg text-sm border border-slate-700">{tech}</span>
              ))}
            </div>
          </section>

          {/* GitHub Info (if safe to show) */}
          {project.github && (
            <section className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-6 h-6 text-slate-300" fill="currentColor" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
                <h3 className="text-lg font-bold text-white">Repository Details</h3>
              </div>
              <div className="space-y-3 text-sm text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">Last Update</span>
                  <span>{project.github.lastUpdate}</span>
                </div>
                {project.github.languages && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Languages</span>
                    <span className="text-right">{project.github.languages.join(', ')}</span>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Seller Card */}
          <section className="bg-slate-800 p-6 rounded-2xl border border-slate-700 text-center">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">Developed By</h3>
            <img src={settings?.profilePhoto || siteConfig.profilePhoto} alt={settings?.sellerName || siteConfig.sellerName} className="w-24 h-24 rounded-full mx-auto mb-4 border-2 border-blue-500 p-1" />
            <h4 className="text-xl font-bold text-white">{settings?.sellerName || siteConfig.sellerName}</h4>
            <p className="text-blue-400 text-sm mb-6">{settings?.developerTitle || siteConfig.developerTitle}</p>
            <div className="flex justify-center gap-3">
              <a href={`mailto:${settings?.email || siteConfig.email}`} className="p-2 bg-slate-900 rounded-lg hover:bg-blue-600 transition-colors text-slate-300 hover:text-white" title="Email">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.53 4.389a2 2 0 001.94 0L20 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              </a>
              <a href={settings?.githubProfile || siteConfig.githubProfile} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-900 rounded-lg hover:bg-blue-600 transition-colors text-slate-300 hover:text-white" title="GitHub">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
              </a>
            </div>
          </section>

          {/* Project Gallery / Related Images */}
          <section className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-8">Project Snapshots</h3>
            <div className="space-y-4">
              {galleryImages.map((imgUrl, idx) => (
                <div key={idx} className={`rounded-xl overflow-hidden border border-slate-700 relative group ${idx === 0 ? 'mb-10' : ''}`}>
                  <img 
                    src={imgUrl} 
                    alt={`${project.title} related snapshot ${idx + 1}`} 
                    className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-500" 
                    onError={(e) => { 
                      e.target.onerror = null;
                      e.target.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><rect width="800" height="600" fill="%231e293b"/><text x="400" y="300" font-family="sans-serif" font-size="24" fill="%2364748b" text-anchor="middle" dominant-baseline="middle">Snapshot Preview</text></svg>`;
                    }}
                  />
                  <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
