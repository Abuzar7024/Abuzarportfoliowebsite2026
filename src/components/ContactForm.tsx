"use client";

import React, { useState, useTransition } from "react";
import { motion, AnimatePresence } from "motion/react";
import { contactSchema, type ContactFormData } from "../lib/contact-schema";
import { AlertCircle, Loader2, Send } from "lucide-react";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { SuccessGame } from "./SuccessGame";

export const ContactForm = () => {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  
  const [formData, setFormData] = useState<Partial<ContactFormData>>({
    purpose: undefined,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("idle");
    setFieldErrors({});

    const formDataObj = new FormData(e.currentTarget);
    const rawData = Object.fromEntries(formDataObj.entries());
    
    // Client-side validation
    const validation = contactSchema.safeParse(rawData);
    if (!validation.success) {
      setFieldErrors(validation.error.flatten().fieldErrors);
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-24c24932/contact`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${publicAnonKey}`,
            },
            body: JSON.stringify(rawData),
          }
        );

        const result = await response.json();

        if (response.ok && result.success) {
          setStatus("success");
          (e.target as HTMLFormElement).reset();
          setFormData({});
        } else {
          setStatus("error");
          setErrorMessage(result.message || "The server encountered an error processing your request.");
        }
      } catch (err) {
        console.error("Submission error:", err);
        setStatus("error");
        setErrorMessage("Failed to establish a secure link to the server. Check your connection.");
      }
    });
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <AnimatePresence mode="wait">
        {status === "success" ? (
          <motion.div
            key="success-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-6"
          >
            <SuccessGame onReset={() => setStatus("idle")} />
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            {/* Honeypot */}
            <input type="text" name="website" className="hidden" tabIndex={-1} autoComplete="off" />

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-white/40 tracking-widest ml-1">Full Name</label>
              <input
                name="fullName"
                placeholder="Abuzar Khan"
                required
                onChange={handleInputChange}
                className={`w-full bg-white/5 border ${fieldErrors.fullName ? 'border-red-500/50' : 'border-white/10'} rounded-xl px-4 py-3 text-white focus:border-cyan-400 outline-none transition-all placeholder:text-white/10`}
              />
              {fieldErrors.fullName && <p className="text-red-400 text-[10px] ml-1">{fieldErrors.fullName[0]}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-white/40 tracking-widest ml-1">Email Address</label>
              <input
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                onChange={handleInputChange}
                className={`w-full bg-white/5 border ${fieldErrors.email ? 'border-red-500/50' : 'border-white/10'} rounded-xl px-4 py-3 text-white focus:border-cyan-400 outline-none transition-all placeholder:text-white/10`}
              />
              {fieldErrors.email && <p className="text-red-400 text-[10px] ml-1">{fieldErrors.email[0]}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-white/40 tracking-widest ml-1">Purpose of Inquiry</label>
              <select
                name="purpose"
                required
                onChange={handleInputChange}
                className={`w-full bg-white/5 border ${fieldErrors.purpose ? 'border-red-500/50' : 'border-white/10'} rounded-xl px-4 py-3 text-white focus:border-cyan-400 outline-none transition-all appearance-none cursor-pointer`}
              >
                <option value="" className="bg-[#050505]">Select Inquiry Type</option>
                <option value="Job opportunity" className="bg-[#050505]">Job opportunity</option>
                <option value="Freelance project" className="bg-[#050505]">Freelance project</option>
                <option value="Collaboration / Other" className="bg-[#050505]">Collaboration / Other</option>
              </select>
              {fieldErrors.purpose && <p className="text-red-400 text-[10px] ml-1">{fieldErrors.purpose[0]}</p>}
            </div>

            {/* Conditional Fields: Freelance */}
            <AnimatePresence>
              {formData.purpose === "Freelance project" && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-5 overflow-hidden"
                >
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-white/40 tracking-widest ml-1">Project Type</label>
                    <select
                      name="projectType"
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-400 outline-none transition-all appearance-none cursor-pointer"
                    >
                      <option value="Mobile app" className="bg-[#050505]">Mobile app</option>
                      <option value="Bug fixing" className="bg-[#050505]">Bug fixing</option>
                      <option value="UI implementation" className="bg-[#050505]">UI implementation</option>
                      <option value="Firebase / backend help" className="bg-[#050505]">Firebase / backend help</option>
                      <option value="Other" className="bg-[#050505]">Other</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-white/40 tracking-widest ml-1">Budget (Optional)</label>
                    <input
                      name="budget"
                      placeholder="e.g. $2000 - $5000"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-400 outline-none transition-all placeholder:text-white/10"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Conditional Fields: Job Opportunity */}
            <AnimatePresence>
              {formData.purpose === "Job opportunity" && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-1 overflow-hidden"
                >
                  <label className="text-[10px] uppercase font-bold text-white/40 tracking-widest ml-1">Company Name (Optional)</label>
                  <input
                    name="companyName"
                    placeholder="Company Inc."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-400 outline-none transition-all placeholder:text-white/10"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-white/40 tracking-widest ml-1">Your Message</label>
              <textarea
                name="message"
                placeholder="Tell me about your project or role..."
                required
                rows={4}
                onChange={handleInputChange}
                className={`w-full bg-white/5 border ${fieldErrors.message ? 'border-red-500/50' : 'border-white/10'} rounded-xl px-4 py-3 text-white focus:border-cyan-400 outline-none transition-all resize-none placeholder:text-white/10`}
              />
              {fieldErrors.message && <p className="text-red-400 text-[10px] ml-1">{fieldErrors.message[0]}</p>}
            </div>

            {status === "error" && (
              <div className="flex items-center gap-2 text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3 text-xs">
                <AlertCircle size={14} />
                <p>{errorMessage || "Failed to process transmission. Please verify fields."}</p>
              </div>
            )}

            <motion.button
              whileTap={{ scale: 0.98 }}
              disabled={isPending}
              className="w-full py-4 bg-white text-black font-black uppercase tracking-[0.2em] text-[11px] rounded-xl flex items-center justify-center gap-3 hover:bg-cyan-400 transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-white/5"
            >
              {isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Inquire Now <Send size={14} />
                </>
              )}
            </motion.button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
};
