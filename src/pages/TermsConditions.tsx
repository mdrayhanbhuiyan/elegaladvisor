import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function TermsConditions() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="pt-32 pb-20 max-w-4xl mx-auto px-4 prose prose-indigo">
        <h1>Terms & Conditions</h1>
        <p>By using E-Legal Advisor, you agree to these terms.</p>
        <h2>Use of Content</h2>
        <p>The content provided is for personal, non-commercial use only. You may not scrape our content for use elsewhere.</p>
        <h2>Disclaimer</h2>
        <p>As stated in our disclaimer, none of the information on this site constitutes professional advice.</p>
      </main>
      <Footer />
    </div>
  );
}
