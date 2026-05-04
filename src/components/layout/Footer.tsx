import { Link } from 'react-router-dom';
import { Facebook, Twitter, Linkedin, Instagram, ArrowUp } from 'lucide-react';

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-primary text-background px-6 pt-24 pb-12">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-16 mb-20">
          <div className="md:col-span-5 space-y-8">
            <div className="flex flex-col items-start gap-4">
               <h2 className="text-3xl font-nameplate text-background tracking-tight">THE LEGAL DAILY</h2>
               <div className="h-px bg-background/20 w-32"></div>
            </div>
            <p className="text-sm font-serif italic text-background/60 leading-relaxed max-w-sm text-left">
              "Providing the definitive record of legal and financial shifts across the North American continent since inception."
            </p>
            <div className="flex items-center gap-4">
              {[Facebook, Twitter, Linkedin, Instagram].map((Icon, idx) => (
                <a key={idx} href="#" className="w-8 h-8 flex items-center justify-center border border-background/20 hover:border-background transition-all">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>
          
          <div className="md:col-span-7 grid grid-cols-2 lg:grid-cols-3 gap-12 text-left">
            <div className="space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Sections</h4>
              <nav className="flex flex-col gap-4">
                {[
                  { name: 'Capital Markets', to: '/category/loans' },
                  { name: 'Incentives', to: '/category/scholarships' },
                  { name: 'Strategic Debt', to: '/category/mortgages' },
                  { name: 'Bulletins', to: '/blog' }
                ].map(link => (
                  <Link key={link.name} to={link.to} className="text-[11px] font-black uppercase tracking-widest hover:underline">{link.name}</Link>
                ))}
              </nav>
            </div>
            <div className="space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Information</h4>
              <nav className="flex flex-col gap-4">
                {[
                  { name: 'The Agency', to: '/about' },
                  { name: 'Contact Desk', to: '/contact' },
                  { name: 'FAQ Archives', to: '/faq' },
                  { name: 'Member Hub', to: '/admin' }
                ].map(link => (
                  <Link key={link.name} to={link.to} className="text-[11px] font-black uppercase tracking-widest hover:underline">{link.name}</Link>
                ))}
              </nav>
            </div>
            <div className="space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Legal</h4>
              <nav className="flex flex-col gap-4">
                {[
                  { name: 'Privacy Registry', to: '/privacy-policy' },
                  { name: 'Terms of Service', to: '/terms' },
                  { name: 'Ethical Charter', to: '/disclaimer' }
                ].map(link => (
                  <Link key={link.name} to={link.to} className="text-[11px] font-black uppercase tracking-widest hover:underline">{link.name}</Link>
                ))}
              </nav>
            </div>
          </div>
        </div>

        <div className="pt-12 border-t border-background/10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-center md:text-left space-y-4">
            <p className="text-[10px] text-background/30 max-w-2xl uppercase tracking-widest leading-relaxed font-black mb-4">
               The Legal Daily is a digital-first publication serving the financial and judicial interests of professional agencies in the USA and Canada.
            </p>
            <div className="flex items-center justify-center md:justify-start gap-4 text-[9px] font-black uppercase tracking-widest opacity-40">
               <span>© {new Date().getFullYear()} The Legal Daily</span>
               <div className="w-1 h-1 bg-background/20 rounded-full"></div>
               <span>Institutional Edition v4.0</span>
            </div>
          </div>
          <button 
            onClick={scrollToTop}
            className="group flex flex-col items-center gap-2"
          >
             <div className="w-10 h-10 border border-background/20 flex items-center justify-center group-hover:border-background transition-all">
                <ArrowUp className="w-4 h-4" />
             </div>
             <span className="text-[8px] font-black uppercase tracking-widest opacity-40">Top</span>
          </button>
        </div>
      </div>
    </footer>
  );
}
