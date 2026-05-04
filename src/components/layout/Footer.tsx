import { Link } from 'react-router-dom';
import { Facebook, Twitter, Linkedin, Instagram } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-secondary text-background border-t border-primary/10 px-6 py-24">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-16 mb-20">
          <div className="md:col-span-4 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary flex items-center justify-center rounded-lg">
                <span className="text-secondary font-black text-lg">E</span>
              </div>
              <span className="text-3xl font-heading text-white italic">E-Legal Advisor</span>
            </div>
            <p className="text-sm text-background/60 leading-relaxed font-light text-left">
              Crafting clarity in the complex worlds of digital legal consulting and high-impact financial guidance.
            </p>
            <div className="flex items-center gap-4">
              {[Facebook, Twitter, Linkedin, Instagram].map((Icon, idx) => (
                <a key={idx} href="#" className="w-10 h-10 rounded-full border border-primary/20 flex items-center justify-center hover:bg-primary hover:text-secondary transition-all">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>
          
          <div className="md:col-span-8 grid grid-cols-2 lg:grid-cols-3 gap-12 text-left">
            <div className="space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Intelligence</h4>
              <nav className="flex flex-col gap-4">
                {[
                  { name: 'Financial Models', to: '/category/loans' },
                  { name: 'Legal Frameworks', to: '/category/law' },
                  { name: 'Strategic Debt', to: '/category/mortgages' },
                  { name: 'Asset Reports', to: '/category/insurance' }
                ].map(link => (
                  <Link key={link.name} to={link.to} className="text-xs text-background/40 hover:text-primary transition-colors uppercase tracking-widest font-bold">{link.name}</Link>
                ))}
              </nav>
            </div>
            <div className="space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Authority</h4>
              <nav className="flex flex-col gap-4">
                {[
                  { name: 'About The Vault', to: '/about' },
                  { name: 'Our Analysts', to: '/about' },
                  { name: 'Resource Hub', to: '/blog' },
                  { name: 'Contact Desk', to: '/contact' }
                ].map(link => (
                  <Link key={link.name} to={link.to} className="text-xs text-background/40 hover:text-primary transition-colors uppercase tracking-widest font-bold">{link.name}</Link>
                ))}
              </nav>
            </div>
            <div className="space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Legal</h4>
              <nav className="flex flex-col gap-4">
                {[
                  { name: 'Privacy Policy', to: '/privacy-policy' },
                  { name: 'Service Terms', to: '/terms' },
                  { name: 'Ethics Charter', to: '/disclaimer' }
                ].map(link => (
                  <Link key={link.name} to={link.to} className="text-xs text-background/40 hover:text-primary transition-colors uppercase tracking-widest font-bold">{link.name}</Link>
                ))}
              </nav>
            </div>
          </div>
        </div>

        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
          <div className="space-y-4">
            <p className="text-[10px] text-background/20 max-w-2xl uppercase tracking-tighter leading-snug">
              Disclaimer: The analytical content provided through this portal constitutes professional opinion and information for the USA & Canada markets exclusively. Non-advisory capacity implicitly maintained.
            </p>
            <p className="text-[9px] font-bold text-primary/40 uppercase tracking-[0.2em]">
              © {new Date().getFullYear()} E-Legal Advisor. All Institutional Rights Reserved.
            </p>
          </div>
          <div className="flex gap-4">
            <div className="px-5 py-2 border border-primary/20 rounded-full h-8 flex items-center justify-center">
              <span className="text-[8px] font-black text-primary/40 uppercase tracking-widest">TLS 1.3 SECURED</span>
            </div>
            <div className="px-5 py-2 border border-primary/20 rounded-full h-8 flex items-center justify-center">
              <span className="text-[8px] font-black text-primary/40 uppercase tracking-widest">INSIDER DATA VERIFIED</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
