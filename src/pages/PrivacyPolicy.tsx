import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="pt-32 pb-20 max-w-4xl mx-auto px-4 prose prose-indigo">
        <h1>Privacy Policy</h1>
        <p>Last updated: {new Date().toLocaleDateString()}</p>
        <p>At E-Legal Advisor, we take your privacy seriously. This policy explains how we collect and use your data.</p>
        <h2>1. Information We Collect</h2>
        <p>We collect information you provide directly to us, such as when you subscribe to our newsletter or contact us.</p>
        <h2>2. Cookies</h2>
        <p>We use cookies to improve your browsing experience and for AdSense ad delivery.</p>
        <h2>3. Third Party Ads</h2>
        <p>Google AdSense uses cookies to serve ads based on a user's prior visits to your website or other websites.</p>
      </main>
      <Footer />
    </div>
  );
}
