import { motion } from 'motion/react';
import { Scan, Zap, Battery, Github, Download, ArrowRight, ShieldCheck, Cpu } from 'lucide-react';

interface LandingPageProps {
  onTryWeb: () => void;
}

export default function LandingPage({ onTryWeb }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white selection:bg-hw-accent selection:text-white overflow-x-hidden">
      {/* Remove Background Orbs */}


      {/* Navigation */}
      <nav className="relative z-50 flex items-center justify-between px-6 py-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-hw-card border border-white/10 rounded-lg flex items-center justify-center">
            <Scan className="w-5 h-5 text-hw-accent/90" />
          </div>
          <span className="text-xl font-bold tracking-tighter uppercase font-mono">
            ScanGen<span className="text-hw-accent">PRO</span>
          </span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-[11px] font-mono uppercase tracking-[0.2em] text-hw-secondary font-bold">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#about" className="hover:text-white transition-colors">Performance</a>
          <a href="https://github.com/abdullach56/ScanGen-PRO" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-2">
            <Github className="w-4 h-4" /> Github
          </a>
        </div>
        <button
          onClick={onTryWeb}
          className="glass-button px-6 py-3 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest"
        >
          Try Demo
        </button>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-32 px-6 max-w-5xl mx-auto text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-5xl md:text-8xl font-bold tracking-tighter leading-[0.9] mb-8 relative"
        >
          <span className="relative inline-block px-4">
            <div className="absolute inset-0 border-l-2 border-t-2 border-hw-accent/30 w-8 h-8 -top-2 -left-2" />
            <div className="absolute inset-0 border-r-2 border-b-2 border-hw-accent/30 w-8 h-8 -bottom-2 -right-2 top-auto left-auto" />
            Secure, Sub-Second Scan.
          </span>
          <br />
          <span className="text-hw-accent relative">
            Instant Payment.
            <div className="absolute -right-10 top-0 hidden md:block">
              <ShieldCheck className="w-8 h-8 text-green-500 opacity-80" />
            </div>
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-lg md:text-xl text-hw-secondary max-w-2xl mx-auto mb-12 leading-relaxed"
        >
          Experience professional-grade efficiency with ScanGen-PRO. Built for privacy and optimized for 4GB RAM phones, it delivers lightning-fast QR detection and instant UPI redirection. The most reliable scanner for your daily payments.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <a
            href="https://abdullach56.github.io/ScanGen-PRO/scangen-pro.apk"
            download="scangen-pro.apk"
            className="w-full sm:w-auto flex items-center justify-center gap-3 bg-hw-accent text-white px-10 py-5 rounded-2xl font-bold text-sm hover:brightness-110 transition-all active:scale-[0.98] shadow-[0_10px_30px_rgba(59,130,246,0.3)]"
          >
            <Download className="w-5 h-5" /> Download for Android
          </a>
          <button
            onClick={onTryWeb}
            className="w-full sm:w-auto flex items-center justify-center gap-3 glass-button px-10 py-5 rounded-2xl font-bold text-sm active:scale-[0.98]"
          >
            Launch Web App <ArrowRight className="w-5 h-5" />
          </button>
        </motion.div>

        {/* Hero Visual */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-32 relative max-w-2xl mx-auto"
        >
          <div className="bg-hw-card rounded-[2rem] p-1 border border-white/5 shadow-2xl relative overflow-hidden aspect-[9/10] sm:aspect-video flex items-center justify-center">
            <div className="text-center space-y-6">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-white/5 flex items-center justify-center border border-white/5">
                <Scan className="w-10 h-10 text-hw-accent/80" />
              </div>
              <div className="space-y-1.5 opacity-20">
                <div className="h-1.5 w-24 bg-white/40 mx-auto rounded-full" />
                <div className="h-1.5 w-16 bg-white/20 mx-auto rounded-full" />
              </div>
            </div>
            {/* Minimal Indicators */}
            <div className="absolute top-8 left-8 p-2 border border-white/5 rounded-lg opacity-40">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="absolute bottom-8 right-8 p-2 border border-white/5 rounded-lg opacity-40">
              <Cpu className="w-5 h-5" />
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-20 space-y-4">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Built for Performance</h2>
          <p className="text-hw-secondary font-mono text-sm uppercase tracking-widest">Minimal footprint. Maximum output.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Zap className="w-8 h-8" />}
            title="Instant UPI Detection"
            description="Deep link integration for all major payment apps like PhonePe, GPay, and Paytm."
            delay={0.1}
          />
          <FeatureCard
            icon={<Cpu className="w-8 h-8" />}
            title="Lightning Performance"
            description="Highly optimized C++ scanning engine running via Capacitor for near-native speeds."
            delay={0.2}
          />
          <FeatureCard
            icon={<Battery className="w-8 h-8" />}
            title="Battery Optimized"
            description="Zero background consumption. Low CPU usage during active scanning cycles."
            delay={0.3}
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-hw-card border border-white/5 rounded-lg flex items-center justify-center">
                <Scan className="w-4 h-4 text-hw-accent/80" />
              </div>
              <span className="text-lg font-bold tracking-tighter uppercase font-mono">
                ScanGen<span className="text-hw-accent">PRO</span>
              </span>
            </div>
            <p className="text-sm text-hw-secondary max-w-xs leading-relaxed">
              The next generation scanning tool for secure and fast data extraction.
            </p>
          </div>
          <div className="flex flex-col md:items-end gap-4">
            <div className="flex items-center gap-8 text-[10px] font-mono font-bold uppercase tracking-widest text-hw-secondary">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="https://github.com" className="hover:text-white transition-colors">GitHub</a>
            </div>
            <p className="text-[10px] font-mono text-hw-secondary/40 uppercase tracking-widest pt-4">
              Built by <span className="text-white">Abdulla Charoliya</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description, delay }: { icon: React.ReactNode; title: string; description: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="bg-hw-card p-10 rounded-[2rem] border border-white/5 space-y-6 hover:border-hw-accent/20 transition-colors group shadow-sm"
    >
      <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-hw-accent/60 group-hover:text-hw-accent group-hover:scale-110 transition-all duration-500">
        {icon}
      </div>
      <div className="space-y-3">
        <h3 className="text-xl font-bold tracking-tight">{title}</h3>
        <p className="text-sm text-hw-secondary leading-relaxed font-light">{description}</p>
      </div>
    </motion.div>
  );
}
