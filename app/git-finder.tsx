"use client"

import type React from "react"
import { Octokit } from "octokit"
import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Search,
  GitBranch,
  Star,
  GitCommit,
  MapPin,
  Link as LinkIcon,
  Twitter,
  Users,
  BookOpen,
  Calendar,
  ArrowUpRight,
  Code,
  Activity,
  Layers,
  Terminal,
  Filter,
  FileText
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

// --- Types ---

interface UserProfile {
  login: string
  name: string
  avatar_url: string
  html_url: string
  bio: string
  location: string
  company: string
  blog: string
  twitter_username: string
  public_repos: number
  followers: number
  following: number
  created_at: string
}

interface Repository {
  id: number
  name: string
  description: string
  html_url: string
  stargazers_count: number
  forks_count: number
  language: string
  updated_at: string
  topics: string[]
}

interface ActivityEvent {
  id: string
  type: string
  repo: {
    name: string
  }
  created_at: string
  payload: any
}

// --- Component ---

export default function GitFinder() {
  const [octokit, setOctokit] = useState<Octokit | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Data States
  const [user, setUser] = useState<UserProfile | null>(null)
  const [repos, setRepos] = useState<Repository[]>([])
  const [activities, setActivities] = useState<ActivityEvent[]>([])
  const [languages, setLanguages] = useState<Record<string, number>>({})
  const [readmeContent, setReadmeContent] = useState<string | null>(null)

  // Filter & Sort States
  const [sortBy, setSortBy] = useState<"stars" | "forks" | "updated">("updated")
  const [filterLang, setFilterLang] = useState<string>("all")

  useEffect(() => {
    setOctokit(new Octokit())
  }, [])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim() || !octokit) return

    setLoading(true)
    setError(null)
    setUser(null)
    setRepos([])
    setActivities([])
    setLanguages({})
    setReadmeContent(null)

    try {
      // 1. Fetch User
      const userRes = await octokit.rest.users.getByUsername({ username: searchQuery })
      setUser(userRes.data as any)
      const userData = userRes.data as any;

      // 2. Fetch Repos (for stats & list)
      const reposRes = await octokit.rest.repos.listForUser({
        username: searchQuery,
        sort: "updated",
        per_page: 100, // Get more for better stats
      })
      const fetchedRepos = reposRes.data as any[]
      setRepos(fetchedRepos)

      // Calculate Languages
      const langStats: Record<string, number> = {}
      fetchedRepos.forEach((repo) => {
        if (repo.language) {
          langStats[repo.language] = (langStats[repo.language] || 0) + 1
        }
      })
      setLanguages(langStats)

      // 3. Fetch Recent Activity
      try {
        const activityRes = await octokit.rest.activity.listPublicEventsForUser({
          username: searchQuery,
          per_page: 10,
        })
        setActivities(activityRes.data as any[])
      } catch (err) {
        console.warn("Could not fetch activity", err)
      }

      // 4. Fetch Profile README (username/username)
      try {
         const readmeRes = await octokit.rest.repos.getReadme({
            owner: searchQuery,
            repo: searchQuery,
            mediaType: {
               format: "raw", // Get raw markdown content
            }
         });
         setReadmeContent(String(readmeRes.data));
      } catch (err) {
         // It's common not to have a profile readme
      }

    } catch (err: any) {
      if (err.status === 404) {
        setError("User not found")
      } else {
        setError("Something went wrong. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  // --- Derived State for Filter and Sort ---
  const derivedRepos = useMemo(() => {
    let filtered = [...repos];
    
    // Filter by Language
    if (filterLang !== "all") {
       filtered = filtered.filter(r => r.language === filterLang);
    }

    // Sort
    return filtered.sort((a, b) => {
       if (sortBy === "stars") return b.stargazers_count - a.stargazers_count;
       if (sortBy === "forks") return b.forks_count - a.forks_count;
       return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(); // updated default
    });
  }, [repos, sortBy, filterLang]);


  // Calculate top languages for display
  const topLanguages = Object.entries(languages)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)

  // Calculate total stars
  const totalStars = repos.reduce((acc, repo) => acc + repo.stargazers_count, 0)

  // Calculate most common language explicitly for stats
  const dominantLanguage = topLanguages.length > 0 ? topLanguages[0][0] : "N/A"

  // Available languages for filter dropdown
  const availableLanguages = Object.keys(languages).sort();


  return (
    // Darker Slate Theme Applied Locally
    <div className="w-full min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-blue-500/30">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        
        {/* Header / Search Section */}
        <motion.div 
          layout
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex flex-col items-center justify-center transition-all duration-500 ease-in-out ${user ? 'py-4' : 'h-[80vh]'}`}
        >
          <div className="text-center mb-8 relative">
            <motion.div 
              layoutId="logo"
              className="flex items-center justify-center gap-3 mb-2"
            >
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 shadow-[0_0_20px_-5px_rgba(59,130,246,0.5)]">
                <Terminal className="w-8 h-8 text-blue-400" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-blue-300 to-indigo-400">
                GitFinder
              </h1>
            </motion.div>
            <p className="text-slate-400 text-sm font-light tracking-widest uppercase">
              Advanced GitHub Intelligence
            </p>
          </div>

          <Card className="w-full max-w-lg bg-slate-900/80 backdrop-blur-xl border-slate-800 shadow-xl">
            <CardContent className="p-2">
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    placeholder="Search username (e.g. vercel)..." 
                    className="pl-9 bg-transparent border-transparent focus-visible:ring-0 shadow-none h-11 text-lg text-slate-100 placeholder:text-slate-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button size="lg" type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-lg shadow-blue-500/20">
                  {loading ? <Activity className="w-4 h-4 animate-spin" /> : "Analyze"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 text-red-400 bg-red-400/10 px-4 py-2 rounded-lg border border-red-400/20"
            >
              {error}
            </motion.div>
          )}
        </motion.div>

        {/* Dashboard Content */}
        <AnimatePresence mode="wait">
          {user && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="grid grid-cols-1 md:grid-cols-12 gap-6"
            >
              {/* Left Column: Profile Card & Stats */}
              <div className="md:col-span-4 space-y-6 md:sticky md:top-6 md:h-fit md:max-h-[calc(100vh-3rem)] md:overflow-y-auto custom-scrollbar pr-1">
                <Card className="overflow-hidden border-slate-800 bg-slate-900/80 backdrop-blur-md shadow-lg">
                  <div className="h-32 bg-gradient-to-b from-blue-900/40 to-slate-900/0 relative">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                  </div>
                  <CardContent className="px-6 pb-6 relative">
                    <Avatar className="w-24 h-24 border-4 border-slate-900 absolute -top-12 shadow-xl">
                      <AvatarImage src={user.avatar_url} />
                      <AvatarFallback>{user.login.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    
                    <div className="mt-14 mb-6">
                      <h2 className="text-2xl font-bold text-slate-100">{user.name}</h2>
                      <a href={user.html_url} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 hover:underline text-sm font-mono flex items-center gap-1">
                        @{user.login} <ArrowUpRight className="w-3 h-3" />
                      </a>
                      <p className="mt-4 text-slate-400 leading-relaxed text-sm">
                        {user.bio || "No bio available."}
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-6 text-center">
                      <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                        <div className="text-xl font-bold text-slate-200">{user.followers}</div>
                        <div className="text-[10px] uppercase text-slate-500 font-semibold">Followers</div>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                        <div className="text-xl font-bold text-slate-200">{user.following}</div>
                        <div className="text-[10px] uppercase text-slate-500 font-semibold">Following</div>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                        <div className="text-xl font-bold text-slate-200">{user.public_repos}</div>
                        <div className="text-[10px] uppercase text-slate-500 font-semibold">Repos</div>
                      </div>
                    </div>

                    <div className="space-y-3 text-sm text-slate-400">
                      {user.location && (
                        <div className="flex items-center gap-3">
                          <MapPin className="w-4 h-4 text-blue-400/70" /> {user.location}
                        </div>
                      )}
                      {user.blog && (
                        <div className="flex items-center gap-3">
                          <LinkIcon className="w-4 h-4 text-blue-400/70" />
                          <a href={user.blog.startsWith('http') ? user.blog : `https://${user.blog}`} target="_blank" rel="noreferrer" className="hover:text-blue-400 transition-colors truncate">
                            {user.blog}
                          </a>
                        </div>
                      )}
                      {user.twitter_username && (
                        <div className="flex items-center gap-3">
                          <Twitter className="w-4 h-4 text-blue-400/70" /> @{user.twitter_username}
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-blue-400/70" /> Joined {new Date(user.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Top Languages Chart */}
                {topLanguages.length > 0 && (
                  <Card className="border-slate-800 bg-slate-900/80 backdrop-blur-md shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2 text-slate-200">
                        <Code className="w-4 h-4 text-blue-400" /> Top Languages
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {topLanguages.map(([lang, count]) => (
                        <div key={lang} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-300 font-medium">{lang}</span>
                            <span className="text-slate-500">{(count / repos.length * 100).toFixed(0)}%</span>
                          </div>
                          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500/80 rounded-full transition-all duration-1000 ease-out" 
                              style={{ width: `${(count / repos.length * 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Right Column: Content */}
              <div className="md:col-span-8 space-y-6">
                
                {/* Enhanced Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard title="Total Stars" value={totalStars} icon={<Star className="w-4 h-4" />} />
                  <StatCard title="Dominant Lang" value={dominantLanguage} icon={<Code className="w-4 h-4" />} />
                  <StatCard title="Contribution Score" value={activities.length * 5 + repos.length} icon={<Activity className="w-4 h-4" />} />
                  <StatCard title="Years Active" value={new Date().getFullYear() - new Date(user.created_at).getFullYear()} icon={<Calendar className="w-4 h-4" />} />
                </div>

                {/* Profile README Section */}
                {readmeContent && (
                    <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-md shadow-sm">
                        <CardHeader className="pb-2">
                             <CardTitle className="text-lg flex items-center gap-2 text-slate-200">
                                <FileText className="w-4 h-4 text-blue-400" /> Profile Readme
                             </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="prose prose-invert prose-sm max-w-none text-slate-300 overflow-hidden box-border bg-slate-950/50 p-4 rounded-lg border border-slate-800/50">
                                <pre className="whitespace-pre-wrap font-mono text-xs overflow-x-auto text-slate-400">
                                    {readmeContent.slice(0, 1000)}
                                    {readmeContent.length > 1000 && "\n... (truncated)"}
                                </pre>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Recent Activity */}
                <Card className="border-slate-800 bg-slate-900/80 backdrop-blur-md shadow-sm">
                   <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2 text-slate-200">
                        <Activity className="w-4 h-4 text-blue-400" /> Recent Activity
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[200px] pr-4 overflow-y-auto custom-scrollbar">
                        <div className="space-y-4">
                          {activities.length > 0 ? activities.map((event) => (
                             <div key={event.id} className="flex gap-4 items-start text-sm">
                               <div className="mt-1 min-w-[2rem] flex justify-center">
                                 {getEventIcon(event.type)}
                               </div>
                               <div>
                                 <p className="text-slate-200">
                                   <span className="font-semibold">{formatEventAction(event.type)}</span> in{" "}
                                   <span className="text-blue-400 font-mono">{event.repo.name}</span>
                                 </p>
                                 <p className="text-xs text-slate-500">{formatDistanceToNow(new Date(event.created_at))} ago</p>
                               </div>
                             </div>
                          )) : (
                            <p className="text-slate-500 text-sm">No recent public activity found.</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                </Card>

                {/* Repositories Grid & Filter */}
                <div>
                   <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                       <h3 className="text-xl font-bold flex items-center gap-2 text-slate-100">
                          <BookOpen className="w-5 h-5 text-blue-400" /> 
                          Repositories 
                          <Badge variant="outline" className="text-blue-400 border-blue-500/20">{repos.length}</Badge>
                       </h3>
                       
                       {/* Filter Controls */}
                       <div className="flex gap-2 w-full md:w-auto">
                           <select 
                              value={filterLang} 
                              onChange={(e) => setFilterLang(e.target.value)}
                              className="w-[140px] bg-slate-900 border border-slate-700 text-slate-300 rounded-md h-9 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                           >
                               <option value="all">All Languages</option>
                               {availableLanguages.map(l => <option key={l} value={l}>{l}</option>)}
                           </select>
                           
                           <select 
                              value={sortBy} 
                              onChange={(e) => setSortBy(e.target.value as any)}
                              className="w-[140px] bg-slate-900 border border-slate-700 text-slate-300 rounded-md h-9 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                           >
                               <option value="updated">Latest</option>
                               <option value="stars">Most Stars</option>
                               <option value="forks">Most Forks</option>
                           </select>
                       </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {derivedRepos.slice(0, 6).map((repo) => (
                        <Card key={repo.id} className="group border-slate-800 bg-slate-900/90 hover:bg-slate-800/80 transition-all duration-300 backdrop-blur-sm shadow-sm hover:shadow-lg hover:border-blue-500/30">
                          <CardContent className="p-5">
                            <div className="flex justify-between items-start mb-2">
                              <a href={repo.html_url} target="_blank" className="font-semibold text-blue-400 hover:text-blue-300 hover:underline truncate pr-4 text-base">
                                {repo.name}
                              </a>
                              <div className="flex items-center gap-1 text-xs text-slate-400 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                                <Star className="w-3 h-3 text-yellow-500" /> {repo.stargazers_count}
                              </div>
                            </div>
                            <p className="text-sm text-slate-400 line-clamp-2 h-10 mb-4">
                              {repo.description || "No description provided."}
                            </p>
                            <div className="flex justify-between items-center text-xs text-slate-500">
                               <div className="flex items-center gap-2">
                                  {repo.language && (
                                    <span className="flex items-center gap-1">
                                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                      {repo.language}
                                    </span>
                                  )}
                               </div>
                               <span>{new Date(repo.updated_at).toLocaleDateString()}</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                   </div>
                   
                   {derivedRepos.length === 0 && (
                       <div className="text-center py-10 text-slate-500 border border-dashed border-slate-800 rounded-lg">
                           No repositories match your filter.
                       </div>
                   )}

                   {derivedRepos.length > 6 && (
                     <div className="mt-4 text-center">
                       <Button variant="outline" asChild className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800">
                          <a href={`https://github.com/${user.login}?tab=repositories`} target="_blank">View All {derivedRepos.length} Repos on GitHub</a>
                       </Button>
                     </div>
                   )}
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon }: { title: string, value: string | number, icon: any }) {
  return (
    <Card className="bg-slate-900/80 border-slate-800 shadow-sm">
      <CardContent className="p-4 flex flex-col items-center justify-center text-center">
        <div className="text-slate-500 mb-2 opacity-50">{icon}</div>
        <div className="text-2xl font-bold text-slate-100">{value}</div>
        <div className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">{title}</div>
      </CardContent>
    </Card>
  )
}

function getEventIcon(type: string) {
  switch (type) {
    case "PushEvent": return <GitCommit className="w-4 h-4 text-blue-400" />
    case "PullRequestEvent": return <GitBranch className="w-4 h-4 text-purple-400" />
    case "WatchEvent": return <Star className="w-4 h-4 text-yellow-400" />
    default: return <Activity className="w-4 h-4 text-slate-400" />
  }
}

function formatEventAction(type: string) {
  switch (type) {
    case "PushEvent": return "Pushed to"
    case "PullRequestEvent": return "Opened PR in"
    case "WatchEvent": return "Starred"
    case "CreateEvent": return "Created"
    case "ForkEvent": return "Forked"
    case "IssuesEvent": return "Opened issue in"
    default: return "Interacted with"
  }
}
