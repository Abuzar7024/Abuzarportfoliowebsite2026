import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { fadeIn, modalVariants } from "../lib/motion-variants";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { toast } from "sonner@2.0.3";
import { 
  X, 
  Globe, 
  ShieldCheck,
  Play,
  Apple,
  ExternalLink,
  Info,
  Github
} from "lucide-react";

interface ProjectLinks {
  website?: string | null;
  playstore?: string | null;
  appstore?: string | null;
  github?: string | null;
}

interface Project {
  id: string;
  title: string;
  category: string;
  role: string;
  image: string;
  description: string;
  details: string[];
  tech: string[];
  links: ProjectLinks;
  color: string;
  accent: string;
}

const projects: Project[] = [
  {
    id: "ai-kiosk",
    title: "AI Retail Try-On Kiosk",
    category: "AI & Retail",
    role: "Flutter Developer",
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.0.0&q=80&w=1080",
    description: "An AI-powered retail kiosk application designed for shopping malls that allows customers to explore fashion collections, capture their photo, and virtually try on outfits available in the store's SKU inventory.",
    details: [
      "AI Virtual Try-On",
      "Live Camera Capture",
      "Fashion Recommendations",
      "Product SKU Integration",
      "Interactive Kiosk Experience",
      "Session Management",
      "Image Upload Pipeline",
      "AI Image Processing",
      "Responsive Tablet UI",
      "Shopping Cart Integration"
    ],
    tech: ["Flutter", "Riverpod", "REST APIs", "Firebase", "Computer Vision", "Camera", "Image Processing"],
    links: { 
      website: null, 
      playstore: null, 
      appstore: null,
      github: null
    },
    color: "bg-cyan-500/5",
    accent: "text-cyan-400"
  },
  {
    id: "essonify",
    title: "Essonify",
    category: "AI Fashion Platform",
    role: "Flutter Developer",
    image: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.0.0&q=80&w=1080",
    description: "Worked on a production AI-powered fashion platform that helps users discover personalized outfits, create AI-generated style moments, interact with a fashion community, and purchase recommended products.",
    details: [
      "API Integration",
      "AI Outfit Generation Flow",
      "Shopping Bag & Checkout",
      "Collections Management",
      "Calendar Integration",
      "Subscription System",
      "Payment Integration (Stripe)",
      "Pagination & Infinite Scroll",
      "Profile Features & Settings",
      "Bug Fixes & Refactoring",
      "Performance Optimization",
      "State Management (Provider)"
    ],
    tech: ["Flutter", "Provider", "REST APIs", "Firebase", "Stripe", "AI Recommendation"],
    links: { 
      website: "https://www.essonify.com/features", 
      playstore: null, 
      appstore: null,
      github: null
    },
    color: "bg-rose-500/5",
    accent: "text-rose-400"
  },
  {
    id: "face-detection",
    title: "AI Face Analysis",
    category: "Computer Vision",
    role: "Flutter Developer",
    image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.0.0&q=80&w=1080",
    description: "Developed a Flutter application capable of real-time facial analysis using AI models. The application captures facial vectors and attributes using the device camera and communicates with AI services for real-time inference.",
    details: [
      "Live Face Detection & Attribute Tracking",
      "Age Prediction Model Integration",
      "Gender Prediction Inference",
      "Skin Tone Detection Algorithms",
      "Face Embedding Generation & Verification",
      "Face Vector Extraction & Storage",
      "Camera Frame Processing Pipeline",
      "AI API Integration & Latency Tuning",
      "High-Speed Real-time Image Processing"
    ],
    tech: ["Flutter", "Camera", "Image Processing", "AI APIs", "REST APIs"],
    links: { 
      website: null, 
      playstore: null, 
      appstore: null,
      github: null
    },
    color: "bg-emerald-500/5",
    accent: "text-emerald-400"
  },
  {
    id: "tajneed",
    title: "Tajneed",
    category: "Government / Recruitment",
    role: "Flutter Developer",
    image: "https://images.unsplash.com/photo-1588511986632-592db3d6c81f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnb3Zlcm5tZW50JTIwcmVjcnVpdG1lbnQlMjBwb3J0YWwlMjBpbnRlcmZhY2V8ZW58MXx8fHwxNzcwMjA2MjU1fDA&ixlib=rb-4.1.0&q=80&w=1080",
    description: "Recruitment system for the Ministry of Defence U.A.E. featuring multi-step dynamic forms for military registration.",
    details: [
      "Developed complex multi-step dynamic forms with validation and draft saving.",
      "Improved API handling to reduce form submission failures and data mismatch.",
      "Fixed UI alignment and responsiveness issues across various screen sizes.",
      "Implemented token refresh and session expiry handling for secure authentication.",
      "Optimized loading times by restructuring API calls and improving data flow."
    ],
    tech: ["Flutter", "GetX", "REST APIs", "JSON", "Security Tokens"],
    links: { 
      website: "https://www.tajneed.gov.ae/", 
      playstore: "https://play.google.com/store/apps/details?id=ae.mod.tajneed&pcampaignid=web_share", 
      appstore: "https://apps.apple.com/ae/app/tajneed/id6517355120",
      github: null
    },
    color: "bg-blue-500/5",
    accent: "text-blue-400"
  },
  {
    id: "sadeeq-user",
    title: "Sadeeq User App",
    category: "Home Services",
    role: "Lead Flutter Developer",
    image: "https://images.unsplash.com/photo-1768987439382-894ea4e2a736?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzZXJ2aWNlJTIwbWFya2V0cGxhY2UlMjBtb2JpbGUlMjBhcHAlMjBhcHAlMjBzdG9yZXxlbnwxfHx8fDE3NzAyMDYyNTR8MA&ixlib=rb-4.1.0&q=80&w=1080",
    description: "Introducing Sadeeq: Your Trusted Home Service Partner. Sadeeq is your one-stop solution for all household needs, offering 50+ services delivered by background-verified professionals with pre-approved pricing.",
    details: [
      "Architected a scalable mobile solution using GetX and Clean Architecture.",
      "Integrated real-time service tracking and Google Maps API.",
      "Developed a secure payment gateway integration for seamless transactions.",
      "Implemented a personalized notification system for service updates.",
      "Streamlined the booking flow to ensure user-friendly access to household services."
    ],
    tech: ["Flutter", "GetX", "Google Maps API", "REST APIs", "Firebase"],
    links: { 
      website: "https://sadeeq.beserved.net/#/", 
      playstore: "https://play.google.com/store/apps/details?id=com.user.sadeeq&pcampaignid=web_share", 
      appstore: null,
      github: null
    },
    color: "bg-yellow-500/5",
    accent: "text-yellow-400"
  },
  {
    id: "sadeeq-provider",
    title: "Sadeeq Provider",
    category: "Business Tool",
    role: "Lead Flutter Developer",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMG1hbmFnZW1lbnQlMjBhcHAlMjBkYXNoYm9hcmQlMjBhbmFseXRpY3N8ZW58MXx8fHwxNzcwMjA2MjU1fDA&ixlib=rb-4.1.0&q=80&w=1080",
    description: "Empowering professionals within the Sadeeq ecosystem. This provider app enables experts to manage service requests, track earnings, and communicate with customers in real-time.",
    details: [
      "Built a robust job management dashboard with real-time status updates.",
      "Implemented performance analytics and earnings reporting modules.",
      "Developed a real-time chat system for provider-customer communication.",
      "Optimized background location services for provider tracking."
    ],
    tech: ["Flutter", "GetX", "REST APIs", "Google Maps API", "Firebase"],
    links: { 
      website: "https://sadeeq.beserved.net/#/", 
      playstore: "https://play.google.com/store/apps/details?id=ae.sadeeq.provider&pcampaignid=web_share", 
      appstore: null,
      github: null
    },
    color: "bg-purple-500/5",
    accent: "text-purple-400"
  },
  {
    id: "riayah",
    title: "Riayah",
    category: "Healthcare",
    role: "Flutter Developer",
    image: "https://images.unsplash.com/photo-1767449441925-737379bc2c4d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFsdGhjYXJlJTIwZGFzaGJvYXJkJTIwYXBwJTIwaW50ZXJmYWNlfGVufDF8fHx8MTc3MDIwNjI1NXww&ixlib=rb-4.1.0&q=80&w=1080",
    description: "A high-performance healthcare management application designed for seamless patient tracking, appointment scheduling, and clinical data management with robust state handling.",
    details: [
      "Optimized dashboard and heavy screens, reducing UI freezes.",
      "Cleaned up API response mapping and fixed state management issues.",
      "Resolved data-related bugs across appointments and user profiles.",
      "Implemented intelligent caching for faster data fetching.",
      "Integrated FCM notification issues for background and killed-state behavior."
    ],
    tech: ["Flutter", "Provider", "REST APIs", "Firebase", "FCM"],
    links: { 
      website: null, 
      playstore: "https://play.google.com/store/apps/details?id=com.app.riayah&pcampaignid=web_share", 
      appstore: null,
      github: null
    },
    color: "bg-green-500/5",
    accent: "text-green-400"
  }
];

export const Projects = () => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    if (selectedProject) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedProject]);

  const handleLinkClick = (url: string | null | undefined, platform: string) => {
    if (!url) {
      toast("Coming Soon", {
        description: `The ${platform} version of this application is currently under deployment. Stay tuned!`,
        icon: <Info className="text-cyan-400" size={16} />,
        position: "bottom-center",
        duration: 4000,
        className: "bg-[#0a0a0a] border border-white/10 text-white rounded-2xl",
      });
      return;
    }
    window.open(url, "_blank");
  };

  return (
    <section id="projects" className="py-24 px-4 sm:px-6 max-w-7xl mx-auto overflow-hidden">
      <div className="mb-16 text-center">
        <h2 className="text-[10px] md:text-sm uppercase tracking-[0.3em] text-cyan-400 font-bold mb-4">Laboratory</h2>
        <h3 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tighter italic uppercase">Featured Works</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12">
        {projects.map((project, idx) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            viewport={{ once: true }}
            className={`group relative flex flex-col bg-[#050505]/80 backdrop-blur-md border border-white/10 rounded-[2rem] md:rounded-[4rem] overflow-hidden hover:border-cyan-500/30 hover:shadow-[0_0_40px_rgba(6,182,212,0.15)] transition-all duration-500`}
          >
            {/* Project Image Preview */}
            <div className="relative h-64 md:h-80 overflow-hidden">
                <ImageWithFallback 
                    src={project.image} 
                    alt={project.title}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/20 to-transparent" />
                
                {/* Floating Tags */}
                <div className="absolute top-6 left-6 flex items-center gap-2">
                    <div className="px-3 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-full flex items-center gap-2">
                        <ShieldCheck size={10} className="text-cyan-400" />
                        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/80">Active</span>
                    </div>
                </div>

                <div className="absolute bottom-6 left-6 right-6">
                     <p className={`text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] ${project.accent} mb-1`}>{project.category}</p>
                     <h4 className="text-2xl md:text-4xl font-black text-white leading-tight tracking-tighter uppercase italic drop-shadow-lg truncate">
                        {project.title}
                    </h4>
                </div>
            </div>

            {/* Project Description Brief */}
            <div className="p-6 md:p-10 pt-4 flex-1 flex flex-col justify-between">
              <div>
                <p className="text-white/45 text-[11px] md:text-sm italic leading-relaxed line-clamp-3 mb-6">
                  {project.description}
                </p>
                
                {/* Tech Stack Tags */}
                <div className="flex flex-wrap gap-1.5 mb-6">
                  {project.tech.map((t, techIdx) => (
                    <span 
                      key={techIdx} 
                      className="px-2.5 py-1 bg-white/[0.03] border border-white/5 rounded-md text-[8px] md:text-[9px] font-black uppercase text-cyan-400/90 font-mono tracking-wider"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-6 border-t border-white/5">
                <div className="flex flex-col">
                    <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Responsibility</span>
                    <span className="text-[10px] md:text-xs font-bold text-white/60 italic">{project.role}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  {project.links.website && (
                    <button
                      onClick={() => handleLinkClick(project.links.website, "Website")}
                      className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-white/60 hover:text-cyan-400 hover:border-cyan-500/30 transition-all cursor-pointer"
                      title="Live Website"
                    >
                      <Globe size={14} />
                    </button>
                  )}
                  {project.links.github && (
                    <button
                      onClick={() => handleLinkClick(project.links.github, "GitHub")}
                      className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-white/60 hover:text-cyan-400 hover:border-cyan-500/30 transition-all cursor-pointer"
                      title="GitHub Repository"
                    >
                      <Github size={14} />
                    </button>
                  )}
                  <button 
                    onClick={() => setSelectedProject(project)}
                    className="group/btn flex items-center gap-2 px-4 py-2.5 bg-white text-black text-[9px] md:text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-cyan-400 transition-all cursor-pointer shadow-xl active:scale-95 animate-none"
                  >
                    Analyze
                    <ExternalLink size={12} className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedProject && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 overflow-hidden">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setSelectedProject(null)} 
              className="absolute inset-0 bg-black/98 backdrop-blur-3xl" 
            />
            
            <motion.div 
              variants={modalVariants} 
              initial="initial" 
              animate="animate" 
              exit="exit" 
              className="relative w-full max-w-3xl max-h-[90vh] bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] md:rounded-[4rem] flex flex-col shadow-2xl overflow-hidden"
            >
              {/* Close Button */}
              <div className="absolute top-6 right-6 z-30">
                <button 
                  onClick={() => setSelectedProject(null)} 
                  className="w-10 h-10 flex items-center justify-center bg-white/5 border border-white/10 rounded-full text-white/40 hover:text-white transition-colors cursor-pointer active:scale-90"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 md:p-14 custom-scrollbar">
                <div className="pt-4 md:pt-0">
                  <div className="relative h-40 md:h-72 w-full rounded-[1.5rem] md:rounded-[3rem] overflow-hidden mb-8 md:mb-10 border border-white/10">
                      <ImageWithFallback 
                        src={selectedProject.image} 
                        alt={selectedProject.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                  </div>

                  <div className="mb-8 md:mb-10 text-center md:text-left">
                    <h2 className="text-3xl md:text-6xl font-black text-white mb-4 md:mb-6 uppercase italic tracking-tighter leading-none">{selectedProject.title}</h2>
                    <p className="text-white/60 text-sm md:text-xl leading-relaxed italic font-medium max-w-2xl">
                      "{selectedProject.description}"
                    </p>
                  </div>

                  <div className="space-y-3 md:space-y-4 mb-10 md:mb-12">
                    <div className="flex items-center gap-4 mb-6 md:mb-8">
                        <h5 className="text-[9px] md:text-[10px] font-black text-cyan-400 uppercase tracking-[0.4em] whitespace-nowrap">Development Log</h5>
                        <div className="h-px flex-1 bg-cyan-400/20" />
                    </div>
                    {selectedProject.details.map((d, i) => (
                      <motion.div 
                        key={i} 
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="p-4 md:p-5 bg-white/[0.02] rounded-2xl md:rounded-[2rem] border border-white/[0.05] text-[11px] md:text-[14px] text-white/50 flex items-center gap-4 md:gap-5 hover:bg-white/[0.04] transition-colors group"
                      >
                        <div className="shrink-0 w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-cyan-400 group-hover:scale-150 transition-transform shadow-[0_0_10px_rgba(34,211,238,0.5)]" /> 
                        <span className="leading-tight group-hover:text-white/80 transition-colors">{d}</span>
                      </motion.div>
                    ))}
                  </div>

                  {/* Actions Section */}
                  <div className="space-y-3 md:space-y-4 pt-6 border-t border-white/5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                      <button 
                        onClick={() => handleLinkClick(selectedProject.links.playstore, "Play Store")}
                        className="flex items-center justify-center gap-3 py-4 md:py-6 bg-cyan-500 text-black rounded-2xl md:rounded-[2.5rem] text-[9px] md:text-[11px] font-black uppercase tracking-widest hover:bg-cyan-400 transition-all shadow-[0_10px_40px_rgba(6,182,212,0.3)] active:scale-95 cursor-pointer"
                      >
                        <Play size={16} fill="currentColor" /> Play Store
                      </button>
                      <button 
                        onClick={() => handleLinkClick(selectedProject.links.appstore, "App Store")}
                        className="flex items-center justify-center gap-3 py-4 md:py-6 bg-white/5 border border-white/10 rounded-2xl md:rounded-[2.5rem] text-[9px] md:text-[11px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all active:scale-95 cursor-pointer relative overflow-hidden group/store"
                      >
                        <Apple size={16} /> 
                        <span>App Store</span>
                        {!selectedProject.links.appstore && (
                          <span className="absolute -top-1 -right-1 px-2 py-0.5 bg-cyan-400 text-black text-[7px] font-black rounded-bl-lg opacity-0 group-hover/store:opacity-100 transition-opacity">SOON</span>
                        )}
                      </button>
                    </div>
                    
                    {selectedProject.links.website && (
                      <button 
                        onClick={() => handleLinkClick(selectedProject.links.website, "Website")}
                        className="flex items-center justify-center gap-3 w-full py-4 md:py-6 bg-white/5 border border-white/10 rounded-2xl md:rounded-[2.5rem] text-[9px] md:text-[11px] font-black uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/10 transition-all active:scale-95 cursor-pointer"
                      >
                        <Globe size={16} /> Live Website
                      </button>
                    )}
                    
                    {selectedProject.links.github && (
                      <button 
                        onClick={() => handleLinkClick(selectedProject.links.github, "GitHub")}
                        className="flex items-center justify-center gap-3 w-full py-4 md:py-6 bg-white/5 border border-white/10 rounded-2xl md:rounded-[2.5rem] text-[9px] md:text-[11px] font-black uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/10 transition-all active:scale-95 cursor-pointer"
                      >
                        <Github size={16} /> GitHub Repository
                      </button>
                    )}

                    {!selectedProject.links.website && !selectedProject.links.github && (
                      <div className="w-full py-4 md:py-6 text-center text-[8px] font-black uppercase tracking-[0.4em] text-white/10 border border-white/[0.02] rounded-3xl">
                        Website_Endpoint_Offline
                      </div>
                    )}
                    
                    <button 
                      onClick={() => setSelectedProject(null)} 
                      className="w-full pt-8 md:pt-12 pb-4 text-[9px] md:text-[10px] font-black uppercase tracking-[0.6em] text-white/10 hover:text-cyan-400 transition-colors cursor-pointer"
                    >
                      [ Close_System_Protocol ]
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};
