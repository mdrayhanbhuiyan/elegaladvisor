import { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ShieldCheck, LogIn } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

export default function AdminLogin() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user is an admin
      const adminDoc = await getDoc(doc(db, 'admins', user.uid));
      
      // AUTO-ADMIN for the specific email from prompt context IF no admins exist or it matches
      if (!adminDoc.exists() && (user.email === 'rayhanbhuiyan2021@gmail.com')) {
        await setDoc(doc(db, 'admins', user.uid), {
          email: user.email,
          createdAt: new Date().toISOString()
        });
        toast.success("Welcome, primary admin!");
        navigate('/admin');
      } else if (adminDoc.exists()) {
        toast.success("Logged in successfully!");
        const from = (location.state as any)?.from?.pathname || "/admin";
        navigate(from, { replace: true });
      } else {
        toast.error("Access denied. You are not an authorized administrator.");
        await auth.signOut();
      }
    } catch (error: any) {
      toast.error("Login failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-indigo-600 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl overflow-hidden">
        <CardHeader className="text-center bg-white pb-10 pt-12">
          <div className="mx-auto w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg rotate-3">
            <ShieldCheck className="text-white w-10 h-10" />
          </div>
          <CardTitle className="text-3xl font-extrabold text-gray-900 tracking-tight">Admin Gateway</CardTitle>
          <CardDescription className="text-gray-500 mt-2">
            Secure access for E-Legal Advisor administrators
          </CardDescription>
        </CardHeader>
        <CardContent className="bg-gray-50 p-8">
          <Button 
            className="w-full h-14 text-lg font-bold bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all"
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? "Authenticating..." : (
              <>
                <LogIn className="w-5 h-5 mr-3" />
                Sign in with Google
              </>
            )}
          </Button>
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400">
              Only authorized accounts can access the dashboard. 
              Unauthorized access attempts are logged.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
