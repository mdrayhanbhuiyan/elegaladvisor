import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X, Search, User, Newspaper } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES = [
  { name: 'Latest', href: '/' },
  { name: 'Loans', href: '/category/loans' },
  { name: 'Insurance', href: '/category/insurance' },
  { name: 'Scholarships', href: '/category/scholarships' },
  { name: 'Credit Cards', href: '/category/credit-cards' },
  { name: 'Travel', href: '/category/travel' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [date, setDate] = useState('');

  useEffect(() => {
    const d = new Date();
    setDate(d.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }));
  }, []);

  return (
    <header className="bg-background border-b border-primary/10">
      {/* Top Bar - Date and Meta */}
      <div className="border-b border-primary/10 py-2 hidden sm:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center bg-[#fbfaf8]">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">
            {date}
          </span>
          <div className="flex items-center gap-6">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Digital Edition</span>
            <div className="flex items-center gap-4">
               <button className="text-foreground/60 hover:text-primary"><Search className="w-3 h-3" /></button>
               <Link to="/admin" className="text-[10px] font-bold uppercase tracking-tighter text-primary hover:underline">Sign In</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Nameplate (Logo) */}
      <div className="py-8 md:py-12 border-b border-primary/20 bg-[#fbfaf8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
          <Link to="/" className="group inline-block">
            <h1 className="text-4xl md:text-7xl lg:text-8xl font-nameplate text-primary leading-none transition-transform group-hover:scale-[1.02] duration-500">
               THE LEGAL <span className="italic">DAILY</span>
            </h1>
          </Link>
          <div className="mt-4 flex items-center justify-center gap-4 w-full max-w-2xl">
            <div className="h-px bg-primary/20 flex-grow"></div>
            <p className="text-[10px] md:text-xs font-serif italic text-muted-foreground uppercase tracking-[0.3em] whitespace-nowrap">
              Expert intelligence for USA & Canada
            </p>
            <div className="h-px bg-primary/20 flex-grow"></div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="sticky top-0 z-50 bg-background border-b-4 border-primary shadow-sm overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <div className="flex-grow flex justify-center items-center gap-4 md:gap-10">
              {CATEGORIES.map((cat) => (
                <Link 
                  key={cat.name} 
                  to={cat.href} 
                  className="text-[11px] font-black uppercase tracking-widest text-foreground hover:text-primary transition-colors whitespace-nowrap"
                >
                  {cat.name}
                </Link>
              ))}
            </div>

            {/* Mobile Menu Trigger */}
            <div className="md:hidden flex items-center">
              <button 
                onClick={() => setIsOpen(!isOpen)} 
                className="p-2 text-foreground"
              >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Content */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t border-primary/10 overflow-hidden bg-background"
            >
              <div className="p-6 space-y-4">
                {CATEGORIES.map((cat) => (
                  <Link
                    key={cat.name}
                    to={cat.href}
                    className="block text-2xl font-heading text-foreground"
                    onClick={() => setIsOpen(false)}
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
