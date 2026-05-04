import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export default function Contact() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
            <div>
              <h1 className="text-4xl md:text-6xl font-heading font-black text-foreground mb-6 leading-tight tracking-tighter">Contact Our Experts</h1>
              <p className="text-xl text-foreground/60 mb-12 leading-relaxed font-medium">
                Have questions about a specific loan or insurance plan? Our team of analysts is here to help you navigate the complexities of USA & Canada financial laws.
              </p>
              
              <div className="space-y-8">
                <div className="flex items-start gap-4 group">
                  <div className="p-3 bg-primary/10 rounded-xl text-primary transition-all group-hover:bg-primary group-hover:text-primary-foreground"><Mail /></div>
                  <div>
                    <h3 className="font-bold text-foreground">Email Support</h3>
                    <p className="text-foreground/60 font-medium">expert@e-legal-advisor.com</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 group">
                  <div className="p-3 bg-primary/10 rounded-xl text-primary transition-all group-hover:bg-primary group-hover:text-primary-foreground"><MapPin /></div>
                  <div>
                    <h3 className="font-bold text-foreground">Office Location</h3>
                    <p className="text-foreground/60 font-medium">Downtown, Toronto, ON, Canada</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-background rounded-3xl shadow-2xl p-10 border border-border">
              <form className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-foreground/70 uppercase tracking-widest text-[10px]">First Name</label>
                    <Input placeholder="John" className="h-12 bg-secondary/5 border-border focus:ring-primary" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-foreground/70 uppercase tracking-widest text-[10px]">Last Name</label>
                    <Input placeholder="Doe" className="h-12 bg-secondary/5 border-border focus:ring-primary" />
                  </div>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-foreground/70 uppercase tracking-widest text-[10px]">Email Address</label>
                    <Input type="email" placeholder="john@example.com" className="h-12 bg-secondary/5 border-border focus:ring-primary" />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-foreground/70 uppercase tracking-widest text-[10px]">Message</label>
                    <Textarea placeholder="How can we help you?" className="min-h-32 bg-secondary/5 border-border focus:ring-primary" />
                </div>
                <Button className="w-full h-14 bg-primary text-primary-foreground font-black uppercase tracking-[0.2em] text-xs hover:bg-primary/90 transition-all rounded-2xl shadow-lg">
                  <Send className="w-4 h-4 mr-2" />
                  Send Inquiry
                </Button>
              </form>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
