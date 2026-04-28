"use client";

import React, { useState, useEffect } from "react";
import { auth } from "@/app/config/firebaseClient";
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  User 
} from "firebase/auth";
import { Sparkles, LogIn, User as UserIcon } from "lucide-react";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to authentication state
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login error:", error);
      alert("Login failed. Please check your Firebase configuration.");
    }
  };

  const handleContinueAsGuest = () => {
    setIsGuest(true);
  };

  if (loading) {
    return (
      <div className="flex w-screen h-screen items-center justify-center bg-background">
        <Sparkles className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  // Already logged in or continued as guest
  if (user || isGuest) {
    return <>{children}</>;
  }

  // Display login/guest choice screen
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#fffae8] text-foreground p-4 font-sans">
      <div className="bg-white p-8 rounded-[2rem] shadow-xl max-w-md w-full text-center space-y-8 border-2 border-border relative overflow-hidden">
        {/* Decor items (optional) */}
        <div className="absolute top-4 left-6 text-2xl opacity-40">🐶</div>
        <div className="absolute bottom-4 right-6 text-2xl opacity-40">🌈</div>

        <div className="space-y-4 relative z-10 pt-4">
          <div className="mx-auto bg-primary text-primary-foreground w-16 h-16 rounded-[1.2rem] flex items-center justify-center mb-4 shadow-sm">
            <Sparkles className="w-8 h-8 animate-pulse" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center justify-center gap-2">
            Serene 🌻
          </h1>
          <p className="text-muted-foreground font-medium text-sm px-4">
            Your positive and supportive AI mental health companion.
          </p>
        </div>

        <div className="space-y-4 relative z-10">
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-2 bg-[#fffbed] border-2 border-primary hover:bg-primary hover:text-primary-foreground text-foreground font-bold py-3.5 px-4 rounded-[1.2rem] transition-colors shadow-sm text-sm"
          >
            <LogIn className="w-5 h-5" />
            Sign in with Google
          </button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-border border-dashed"></div>
            </div>
            <div className="relative flex justify-center text-xs font-bold uppercase tracking-wider">
              <span className="px-3 bg-white text-muted-foreground">or</span>
            </div>
          </div>

          <button
            onClick={handleContinueAsGuest}
            className="w-full flex items-center justify-center gap-2 bg-white border-2 border-border hover:bg-accent text-foreground font-bold py-3.5 px-4 rounded-[1.2rem] transition-colors shadow-sm text-sm"
          >
            <UserIcon className="w-5 h-5" />
            Continue as Guest
          </button>
        </div>
      </div>
    </div>
  );
}