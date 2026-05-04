import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X, Search, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const CATEGORIES = [
  { name: 'Loans', href: '/category/loans' },
  { name: 'Insurance', href: '/category/insurance' },
  { name: 'Scholarships', href: '/category/scholarships' },
  { name: 'Credit Cards', href: '/category/credit-cards' },
  { name: 'Travel', href: '/category/travel' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled ? 'bg-background/80 backdrop-blur-xl border-b border-primary/20 py-2' : 'bg-transparent py-6'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo Section */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-primary flex items-center justify-center rounded-xl rotate-3 group-hover:rotate-6 transition-transform shadow-lg shadow-primary/20">
              <ShieldCheck className="text-primary-foreground w-6 h-6" />
            </div>
            <div className="flex flex-col items-start translate-y-0.5">
              <span className="text-xl md:text-2xl font-heading text-foreground font-black tracking-tighter leading-none">
                E-Legal <span className="text-primary italic">Advisor</span>
              </span>
              <span className="text-[7px] font-black uppercase tracking-[0.4em] text-foreground/40 mt-1">Smart Legal Intelligence</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-10">
            {CATEGORIES.map((cat) => (
              <Link 
                key={cat.name} 
                to={cat.href} 
                className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/70 hover:text-primary transition-colors"
              >
                {cat.name}
              </Link>
            ))}
            <div className="h-4 w-px bg-primary/20 mx-2"></div>
            <Link to="/admin">
              <Button variant="ghost" className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-white hover:bg-primary transition-all rounded-full px-6 border border-primary/20 h-9">
                Member Hub
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Trigger */}
          <div className="lg:hidden flex items-center gap-4">
            <Link to="/admin">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </Link>
            <button 
              onClick={() => setIsOpen(!isOpen)} 
              className="p-2 text-secondary hover:text-primary transition-colors"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="lg:hidden absolute top-full left-0 w-full bg-background border-b border-primary/20 shadow-2xl overflow-hidden"
          >
            <div className="px-6 py-10 space-y-8 bg-background">
              {CATEGORIES.map((cat) => (
                <Link
                  key={cat.name}
                  to={cat.href}
                  className="block text-3xl font-heading text-secondary hover:text-primary transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  {cat.name}
                </Link>
              ))}
              <div className="pt-6 border-t border-primary/10">
                <Link to="/admin" onClick={() => setIsOpen(false)}>
                  <Button className="w-full bg-primary text-secondary font-black uppercase tracking-widest rounded-full py-6">
                    Access Portal
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
