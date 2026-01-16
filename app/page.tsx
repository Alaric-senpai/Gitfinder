import GitFinder from "./git-finder";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col bg-background text-foreground">
        <div className="flex-1 w-full flex flex-col">
            <GitFinder />
        </div>
        <footer className="w-full py-6 text-center text-sm text-muted-foreground border-t border-border bg-card/90 backdrop-blur-sm">
            <p className="flex items-center justify-center gap-1">
              Created by <a href="https://devcharles.me/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">Charles Kahuho</a>
            </p>
        </footer>
    </main>
  );
}
