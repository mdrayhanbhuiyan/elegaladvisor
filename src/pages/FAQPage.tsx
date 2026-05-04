import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';

const FAQS = [
  {
    q: "Are your articles written by legal professionals?",
    a: "Our content is research-based and written by financial analysts and experienced legal writers. While highly accurate, it is for informational purposes and not a substitute for individual consulting with a licensed attorney."
  },
  {
    q: "How often do you update loan interest rates?",
    a: "We review and update all market-sensitive data, such as interest rates and scholarship deadlines, on a weekly basis to ensure our readers have the most current information."
  },
  {
    q: "Can I use your templates for my own legal documents?",
    a: "Our templates are provided as examples to help you understand common structures. We strongly recommend having any legal document reviewed by a professional in your specific jurisdiction (USA/Canada)."
  },
  {
    q: "Is e-legal-advisor.com a law firm?",
    a: "No, we are a digital publication focused on financial and legal literacy. we do not provide direct legal representation."
  }
];

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="pt-32 pb-20 max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-12 text-center">Frequently Asked Questions</h1>
        <Accordion {...({ type: "single", collapsible: true } as any)} className="w-full space-y-4">
          {FAQS.map((faq, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="border rounded-2xl px-6 bg-gray-50/50">
              <AccordionTrigger className="text-lg font-bold hover:no-underline text-gray-900">{faq.q}</AccordionTrigger>
              <AccordionContent className="text-gray-600 text-base pb-6 leading-relaxed">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </main>
      <Footer />
    </div>
  );
}
