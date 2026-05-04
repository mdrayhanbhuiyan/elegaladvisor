import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function CookiePolicy() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="pt-32 pb-20 max-w-4xl mx-auto px-4 prose prose-indigo">
        <h1>Cookie Policy</h1>
        <p>We use cookies to ensure you get the best experience on our website.</p>
        <h2>What are cookies?</h2>
        <p>Cookies are small text files stored on your device when you visit websites.</p>
        <h2>How we use them</h2>
        <p>We use functional cookies to remember your settings and analytical cookies to understand site performance. AdSense cookies are used for personalized advertising.</p>
      </main>
      <Footer />
    </div>
  );
}
