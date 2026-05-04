import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-32 pb-20 max-w-4xl mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-7xl font-heading font-black text-foreground mb-6 leading-tight tracking-tighter">Empowering Financial Literacy</h1>
          <p className="text-xl text-foreground/60 leading-relaxed font-medium">
            E-Legal Advisor was founded with a single mission: to provide clear, actionable, and expert guidance on complex financial and legal matters for residents of the USA and Canada.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          <div className="bg-secondary p-10 rounded-[2.5rem] border border-border shadow-sm">
            <h2 className="text-2xl font-heading font-bold text-background mb-4">Our Vision</h2>
            <p className="text-background/80 leading-relaxed">To be the most trusted source of independent financial advice, helping millions bridge the gap between financial goals and reality.</p>
          </div>
          <div className="bg-primary/5 p-10 rounded-[2.5rem] border border-primary/20 shadow-sm">
            <h2 className="text-2xl font-heading font-bold text-primary mb-4">Expertise First</h2>
            <p className="text-foreground/80 leading-relaxed">Every piece of content is researched and reviewed to meet our high standards of accuracy and ethical compliance.</p>
          </div>
        </div>

        <div className="prose prose-slate prose-lg max-w-none text-foreground/80 prose-headings:font-heading prose-headings:text-foreground">
           <h2 className="font-heading font-black tracking-tight text-3xl">Who We Are</h2>
           <p>We are a team of financial analysts, legal researchers, and content creators dedicated to simplifying the North American financial landscape.</p>
           <p>Whether you're looking for the best student loan refinance options in Canada or understanding debt consolidation in the USA, we have the resources you need.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
