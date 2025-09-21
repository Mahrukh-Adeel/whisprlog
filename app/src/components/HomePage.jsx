import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, BookOpen, TrendingUp, Sparkles } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';   

const HomePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/journal');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50/40 via-white to-rose-100/30 dark:from-slate-900 dark:via-slate-800/90 dark:to-rose-950/20">
      <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-rose-50/20 dark:to-rose-950/10"></div>
      
      <div className="relative flex items-center justify-center min-h-screen">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <div className="text-center mb-20">
            <div className="flex justify-center mb-8 relative">
              <div className="absolute -inset-4 bg-rose-100/50 dark:bg-rose-900/20 rounded-full blur-xl"></div>
              <div className="relative bg-white/80 dark:bg-slate-800/60 p-4 rounded-full shadow-sm border border-rose-100/50 dark:border-rose-900/30">
                <Heart className="w-12 h-12 text-rose-400 dark:text-rose-300" />
              </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-extralight text-slate-700 dark:text-slate-100 mb-8 leading-tight tracking-tight">
              Welcome to{' '}
              <span className="relative">
                <span className="text-rose-400 dark:text-rose-300 font-light">WhisprLog</span>
                <div className="absolute -bottom-2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-rose-300/40 to-transparent"></div>
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-500 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed font-light">
              A gentle sanctuary for your thoughts, where every word finds comfort and understanding
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-20">
            <div className="group bg-white/70 dark:bg-slate-800/40 backdrop-blur-sm rounded-3xl p-10 border border-rose-100/60 dark:border-rose-900/30 hover:bg-white/90 dark:hover:bg-slate-800/60 transition-all duration-500 hover:shadow-xl hover:shadow-rose-100/50 dark:hover:shadow-slate-900/30 hover:-translate-y-1">
              <div className="bg-rose-50/80 dark:bg-rose-950/40 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <BookOpen className="w-7 h-7 text-rose-500 dark:text-rose-300" />
              </div>
              <h3 className="text-xl font-light text-slate-700 dark:text-slate-100 mb-4">Express Freely</h3>
              <p className="text-slate-500 dark:text-slate-300 leading-relaxed font-light">
                Pour your heart onto these pages. Every emotion, every thought has a place here in this judgment-free sanctuary.
              </p>
            </div>
            
            <div className="group bg-white/70 dark:bg-slate-800/40 backdrop-blur-sm rounded-3xl p-10 border border-rose-100/60 dark:border-rose-900/30 hover:bg-white/90 dark:hover:bg-slate-800/60 transition-all duration-500 hover:shadow-xl hover:shadow-rose-100/50 dark:hover:shadow-slate-900/30 hover:-translate-y-1">
              <div className="bg-rose-50/80 dark:bg-rose-950/40 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Heart className="w-7 h-7 text-rose-500 dark:text-rose-300" />
              </div>
              <h3 className="text-xl font-light text-slate-700 dark:text-slate-100 mb-4">Gentle Reflection</h3>
              <p className="text-slate-500 dark:text-slate-300 leading-relaxed font-light">
                Experience thoughtful AI that listens with empathy, offering soft insights that honor your emotional journey.
              </p>
            </div>
            
            <div className="group bg-white/70 dark:bg-slate-800/40 backdrop-blur-sm rounded-3xl p-10 border border-rose-100/60 dark:border-rose-900/30 hover:bg-white/90 dark:hover:bg-slate-800/60 transition-all duration-500 hover:shadow-xl hover:shadow-rose-100/50 dark:hover:shadow-slate-900/30 hover:-translate-y-1">
              <div className="bg-rose-50/80 dark:bg-rose-950/40 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="w-7 h-7 text-rose-500 dark:text-rose-300" />
              </div>
              <h3 className="text-xl font-light text-slate-700 dark:text-slate-100 mb-4">Mindful Patterns</h3>
              <p className="text-slate-500 dark:text-slate-300 leading-relaxed font-light">
                Witness the beautiful ebb and flow of your emotions, discovering gentle wisdom in your personal rhythms.
              </p>
            </div>
          </div>

          <div className="text-center mb-16">
            <Link
              to="/auth"
              className="group inline-flex items-center space-x-3 bg-gradient-to-r from-rose-400 to-rose-500 hover:from-rose-500 hover:to-rose-600 dark:from-rose-400 dark:to-rose-500 dark:hover:from-rose-500 dark:hover:to-rose-600 text-white px-12 py-5 rounded-full font-light text-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-rose-200/50 dark:hover:shadow-rose-900/50 hover:-translate-y-0.5"
            >
              <span>Begin Your Journey</span>
              <Heart className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
              <Sparkles className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity duration-300" />
            </Link>
          </div>

          <div className="text-center">
            <div className="max-w-4xl mx-auto">
              <p className="text-slate-400 dark:text-slate-400 leading-relaxed font-light text-lg mb-6">
                Scientific research reveals that journaling nurtures emotional well-being, reduces stress, and deepens self-understanding.
              </p>
              <p className="text-slate-400 dark:text-slate-400 leading-relaxed font-light">
                Let WhisprLog be your gentle companion as you explore the beautiful landscape of your inner world.
              </p>
            </div>
          </div>

          <div className="flex justify-center mt-16 opacity-40">
            <div className="flex space-x-2">
              <div className="w-2 h-2 bg-rose-300 rounded-full"></div>
              <div className="w-2 h-2 bg-rose-300 rounded-full"></div>
              <div className="w-2 h-2 bg-rose-300 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;