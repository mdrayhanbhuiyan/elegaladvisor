import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function Disclaimer() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="pt-32 pb-20 max-w-4xl mx-auto px-4 prose prose-indigo text-center">
        <h1 className="text-4xl font-extrabold mb-8">Legal Disclaimer</h1>
        <p className="text-xl text-gray-600 mb-12">
          The information provided on <strong>E-Legal Advisor</strong> is for general informational purposes only.
        </p>
        <div className="bg-red-50 p-8 rounded-3xl border border-red-100 text-left">
           <h2 className="text-red-900 mt-0">Not Professional Advice</h2>
           <p className="text-red-800">
             All content on this website, including articles on loans, mortgage, insurance, and legal matters, does not constitute professional financial, legal, or tax advice. 
             We are not licensed attorneys or financial advisors.
           </p>
           <h2 className="text-red-900">No Relationship Created</h2>
           <p className="text-red-800">
             Viewing this website or interacting with its content does not create an attorney-client or advisor-client relationship.
           </p>
           <h2 className="text-red-900">Accuracy of Information</h2>
           <p className="text-red-800">
             While we strive for accuracy, laws and financial regulations in the USA and Canada change frequently. We make no guarantees regarding the timeliness or completeness of the information.
           </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
