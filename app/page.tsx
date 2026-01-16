import GitFinder from "./git-finder";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col bg-slate-950 text-slate-50">
        <div className="flex-1 w-full flex flex-col">
            <GitFinder />
        </div>
        <footer className="w-full py-6 text-center text-sm text-slate-400 border-t border-slate-800 bg-slate-900/90 backdrop-blur-sm">
            <p className="flex items-center justify-center gap-1">
              Created by <a href="https://devcharles.me/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 hover:underline font-medium">Charles Kahuho</a>
            </p>
        </footer>
    </main>
  );
}
