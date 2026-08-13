import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Home from './pages/Home';
import ProjectDetails from './pages/ProjectDetails';
import PaymentPage from './pages/PaymentPage';
import WaitingPage from './pages/WaitingPage';
import DownloadPage from './pages/DownloadPage';
import AdminPage from './pages/AdminPage';
import { siteConfig } from './config/siteConfig';
import { getSettings } from './services/api';

function App() {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    getSettings()
      .then(setSettings)
      .catch(console.error);
  }, []);

  const githubUrl = settings?.githubProfile || import.meta.env.VITE_GITHUB_PROFILE || "https://github.com/muthukumar9360";
  const linkedinUrl = settings?.linkedinProfile || import.meta.env.VITE_LINKEDIN_PROFILE || "https://linkedin.com/in/muthukumar9360";
  const leetcodeUrl = settings?.leetcodeProfile || import.meta.env.VITE_LEETCODE_PROFILE || "https://leetcode.com/muthukumar9360";
  const portfolioUrl = settings?.portfolioUrl || import.meta.env.VITE_PORTFOLIO_URL || "#";

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex flex-col">
        <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
          <div className="w-full px-4 md:px-8 py-4 flex justify-between items-center">
            <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
              {siteConfig.websiteName}
            </Link>
            <nav className="flex items-center gap-6 pt-1">
              <a href={githubUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-slate-300 hover:text-white transition-colors flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                GitHub
              </a>
              <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-slate-300 hover:text-[#0A66C2] transition-colors flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                LinkedIn
              </a>
              <a href={leetcodeUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-slate-300 hover:text-[#FFA116] transition-colors flex items-center gap-1.5">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M16.102 17.93l-2.697 2.607c-.466.467-1.111.662-1.823.662s-1.357-.195-1.824-.662l-4.332-4.363c-.467-.467-.702-1.15-.702-1.863s.235-1.357.702-1.824l4.319-4.38c.467-.467 1.125-.645 1.837-.645s1.357.195 1.823.662l2.697 2.606c.514.515 1.365.497 1.9-.038.535-.536.553-1.387.039-1.901l-2.609-2.636a5.055 5.055 0 0 0-2.415-1.22c-.114-.012-.228-.012-.345-.012-.27 0-.543.031-.835.097-1.093.21-2.05.895-2.677 1.761l-4.679 4.65c-.878.879-1.325 2.073-1.325 3.227 0 1.154.447 2.348 1.325 3.227l4.679 4.649c.878.878 2.074 1.325 3.227 1.325 1.154 0 2.349-.447 3.227-1.325l2.697-2.607c.514-.514.496-1.365-.039-1.9-.535-.535-1.386-.553-1.9-.039zM20.811 13.01H10.666c-.702 0-1.27.604-1.27 1.346s.568 1.346 1.27 1.346h10.145c.701 0 1.27-.604 1.27-1.346s-.569-1.346-1.27-1.346z"/></svg>
                LeetCode
              </a>
              <a href={portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-slate-300 hover:text-blue-400 transition-colors flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                Portfolio
              </a>
              <Link to="/admin" className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1.5 border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 rounded-lg ml-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                Admin
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-grow mb-10">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/projects/:slug" element={<ProjectDetails />} />
            <Route path="/payment/:slug" element={<PaymentPage />} />
            <Route path="/waiting/:requestId" element={<WaitingPage />} />
            <Route path="/download/:token" element={<DownloadPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </main>

        <hr />

        <footer className="border-t border-slate-800 py-4">
          <div className="w-full px-4 md:px-8 flex justify-center text-white text-sm">
            <p>&copy; {new Date().getFullYear()} {settings?.sellerName || siteConfig.sellerName}. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
