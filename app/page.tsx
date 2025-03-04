import GitFinder from "./git-finder";

export default function Home() {
  return (
    <div className="w-screen h-screen overflow-x-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700">
        <GitFinder />
        <div className="w-full p-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 flex items-center justify-center font-bold text-lg italic text-white">
            <span>
              Created by <a href="https://github.com/Alaric-senpai" className="text-emerald-400 capitalize no-undeline">Charles Kahuho</a>
            </span>
        </div>
    </div>
  );
}
