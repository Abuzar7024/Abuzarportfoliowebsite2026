import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { fadeIn, staggerContainer } from "../lib/motion-variants";
import { 
  Send, 
  User, 
  Mail, 
  MessageSquare, 
  Briefcase, 
  Building2, 
  DollarSign, 
  Layers,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner@2.0.3";

type InquiryType = "freelance" | "job" | "general";

export const Contact = () => {
  const [loading, setLoading] = useState(false);
  const [inquiryType, setInquiryType] = useState<InquiryType>("general");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      toast.success("Message received by the system!");
    }, 2000);
  };

  return (
    <section id="contact" className="py-24 px-4 sm:px-6 max-w-5xl mx-auto overflow-hidden">
      <motion.div
        variants={staggerContainer}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        className="grid grid-cols-1 lg:grid-cols-[1.2fr_1.8fr] gap-12 lg:gap-20"
      >
        {/* Contact Info */}
        <div className="text-center lg:text-left">
          <motion.div variants={fadeIn} className="mb-10 md:mb-12">
            <h2 className="text-[10px] md:text-sm uppercase tracking-[0.4em] text-cyan-400 font-black mb-4 md:mb-6">Transmissions</h2>
            <h3 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white italic uppercase tracking-tighter leading-none mb-6 md:mb-8">
              Let's <br className="hidden lg:block" /> Connect
            </h3>
            <p className="text-white/40 leading-relaxed font-medium italic text-base md:text-lg max-w-md mx-auto lg:mx-0">
              "Ready to collaborate on high-performance projects or discuss industry-shaping opportunities."
            </p>
          </motion.div>

          <motion.div variants={fadeIn} className="space-y-3 md:space-y-4 max-w-sm mx-auto lg:mx-0">
            <div className="flex items-center gap-4 p-4 md:p-5 bg-white/[0.02] border border-white/5 rounded-2xl md:rounded-3xl group hover:border-cyan-500/30 transition-all text-left">
              <div className="w-10 h-10 md:w-12 md:h-12 shrink-0 rounded-xl md:rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                <Mail size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-[8px] md:text-[10px] font-black text-white/20 uppercase tracking-widest">Email Endpoint</p>
                <p className="text-white/80 font-bold text-xs md:text-base truncate">abuzxarrr87@gmail.com</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 p-4 md:p-5 bg-white/[0.02] border border-white/5 rounded-2xl md:rounded-3xl group hover:border-emerald-500/30 transition-all text-left">
              <div className="w-10 h-10 md:w-12 md:h-12 shrink-0 rounded-xl md:rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                <Briefcase size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-[8px] md:text-[10px] font-black text-white/20 uppercase tracking-widest">WhatsApp Direct</p>
                <p className="text-white/80 font-bold text-xs md:text-base truncate">+91 8770206120</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Dynamic Form */}
        <motion.div variants={fadeIn}>
          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
              {/* Inquiry Type Toggle */}
              <div className="grid grid-cols-3 gap-2 p-1.5 bg-white/[0.03] border border-white/10 rounded-2xl md:rounded-[2rem]">
                {(["general", "freelance", "job"] as InquiryType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setInquiryType(type)}
                    className={`py-2.5 md:py-3 px-2 rounded-xl md:rounded-[1.5rem] text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all truncate ${
                      inquiryType === type 
                        ? "bg-white text-black shadow-xl" 
                        : "text-white/30 hover:text-white/60 hover:bg-white/5"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {/* Name */}
                <div className="space-y-1.5 md:space-y-2">
                  <label className="text-[9px] md:text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-4 flex items-center gap-2">
                    <User size={10} className="text-cyan-400" /> Identity
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="E.g. John Doe"
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl md:rounded-3xl py-3.5 md:py-4 px-5 md:px-6 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-all placeholder:text-white/10"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1.5 md:space-y-2">
                  <label className="text-[9px] md:text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-4 flex items-center gap-2">
                    <Mail size={10} className="text-cyan-400" /> Signal Address
                  </label>
                  <input
                    required
                    type="email"
                    placeholder="john@example.com"
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl md:rounded-3xl py-3.5 md:py-4 px-5 md:px-6 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-all placeholder:text-white/10"
                  />
                </div>
              </div>

              <AnimatePresence mode="wait">
                {inquiryType === "job" && (
                  <motion.div
                    key="job-fields"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-1.5 md:space-y-2"
                  >
                    <label className="text-[9px] md:text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-4 flex items-center gap-2">
                      <Building2 size={10} className="text-cyan-400" /> Organization
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="Company Name"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-2xl md:rounded-3xl py-3.5 md:py-4 px-5 md:px-6 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-all placeholder:text-white/10"
                    />
                  </motion.div>
                )}

                {inquiryType === "freelance" && (
                  <motion.div
                    key="freelance-fields"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6"
                  >
                    <div className="space-y-1.5 md:space-y-2">
                      <label className="text-[9px] md:text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-4 flex items-center gap-2">
                        <Layers size={10} className="text-cyan-400" /> Project Scope
                      </label>
                      <select className="w-full bg-[#050505] border border-white/10 rounded-2xl md:rounded-3xl py-3.5 md:py-4 px-5 md:px-6 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-all appearance-none cursor-pointer">
                        <option value="mobile">Mobile App (Flutter)</option>
                        <option value="web">Web Application</option>
                        <option value="ui">UI/UX Design</option>
                        <option value="other">Consultation</option>
                      </select>
                    </div>
                    <div className="space-y-1.5 md:space-y-2">
                      <label className="text-[9px] md:text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-4 flex items-center gap-2">
                        <DollarSign size={10} className="text-cyan-400" /> Estimation
                      </label>
                      <input
                        type="text"
                        placeholder="Budget (e.g. $2k - $5k)"
                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl md:rounded-3xl py-3.5 md:py-4 px-5 md:px-6 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-all placeholder:text-white/10"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Message */}
              <div className="space-y-1.5 md:space-y-2">
                <label className="text-[9px] md:text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-4 flex items-center gap-2">
                  <MessageSquare size={10} className="text-cyan-400" /> Transmission Details
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Tell me more about your requirements..."
                  className="w-full bg-white/[0.03] border border-white/10 rounded-[1.5rem] md:rounded-[2rem] py-3.5 md:py-4 px-5 md:px-6 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-all resize-none placeholder:text-white/10"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 md:py-5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-black text-[10px] md:text-[11px] font-black uppercase tracking-[0.3em] rounded-2xl md:rounded-[2rem] transition-all flex items-center justify-center gap-3 group shadow-[0_10px_40px_rgba(6,182,212,0.3)] active:scale-95 cursor-pointer"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                ) : (
                  <>
                    Initialize Connection
                    <Send size={14} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </>
                )}
              </button>
              
              <div className="flex items-center justify-center gap-2 opacity-20">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span className="text-[8px] font-black uppercase tracking-widest">Secure TLS 1.3 Protocol</span>
              </div>
            </form>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="h-full flex flex-col items-center justify-center text-center p-8 md:p-12 bg-white/[0.03] border border-white/10 rounded-[2rem] md:rounded-[3rem] backdrop-blur-xl"
            >
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 mb-6 md:mb-8 border border-cyan-500/50">
                <CheckCircle2 size={40} className="md:w-12 md:h-12" />
              </div>
              <h4 className="text-2xl md:text-3xl font-black text-white italic uppercase tracking-tighter mb-4">Transmission Sent</h4>
              <p className="text-white/40 max-w-xs mx-auto mb-8 md:mb-10 text-sm md:text-base leading-relaxed font-medium">
                Your signal has been successfully broadcasted. I will respond to your frequency shortly.
              </p>
              <button
                onClick={() => setSuccess(false)}
                className="px-8 md:px-10 py-3.5 md:py-4 bg-white/5 border border-white/10 text-white text-[9px] md:text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-white/10 transition-all cursor-pointer active:scale-95"
              >
                Broadcast Again
              </button>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </section>
  );
};
