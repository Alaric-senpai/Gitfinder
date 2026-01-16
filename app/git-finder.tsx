"use client"

import type React from "react"
import { Octokit } from "octokit"
import { useState, useEffect } from "react"
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

    try {
      // 1. Fetch User
      const userRes = await octokit.rest.users.getByUsername({ username: searchQuery })
      setUser(userRes.data as any)

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

  // Calculate top languages for display
  const topLanguages = Object.entries(languages)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)

  // Calculate total stars
  const totalStars = repos.reduce((acc, repo) => acc + repo.stargazers_count, 0)

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-background via-background to-secondary/30 text-foreground font-sans selection:bg-primary/20">
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
              <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 shadow-[0_0_15px_-3px_var(--primary)]">
                <Terminal className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/80 to-primary/50">
                GitFinder
              </h1>
            </motion.div>
            <p className="text-muted-foreground text-sm font-light tracking-widest uppercase">
              Advanced GitHub Intelligence
            </p>
          </div>

          <Card className="w-full max-w-lg bg-card/90 backdrop-blur-xl border-border shadow-xl">
            <CardContent className="p-2">
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search username..." 
                    className="pl-9 bg-transparent border-transparent focus-visible:ring-0 shadow-none h-11 text-lg"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button size="lg" type="submit" disabled={loading} className="rounded-lg shadow-lg shadow-primary/20">
                  {loading ? <Activity className="w-4 h-4 animate-spin" /> : "Analyze"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 text-destructive bg-destructive/10 px-4 py-2 rounded-lg border border-destructive/20"
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
                <Card className="overflow-hidden border-border bg-card/85 backdrop-blur-md shadow-md">
                  <div className="h-32 bg-gradient-to-b from-primary/20 to-transparent relative">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                  </div>
                  <CardContent className="px-6 pb-6 relative">
                    <Avatar className="w-24 h-24 border-4 border-card absolute -top-12 shadow-xl">
                      <AvatarImage src={user.avatar_url} />
                      <AvatarFallback>{user.login.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    
                    <div className="mt-14 mb-6">
                      <h2 className="text-2xl font-bold">{user.name}</h2>
                      <a href={user.html_url} target="_blank" rel="noreferrer" className="text-primary hover:underline text-sm font-mono flex items-center gap-1">
                        @{user.login} <ArrowUpRight className="w-3 h-3" />
                      </a>
                      <p className="mt-4 text-muted-foreground leading-relaxed text-sm">
                        {user.bio || "No bio available."}
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-6 text-center">
                      <div className="p-3 rounded-lg bg-secondary/80 border border-border/50">
                        <div className="text-xl font-bold text-primary">{user.followers}</div>
                        <div className="text-[10px] uppercase text-muted-foreground font-semibold">Followers</div>
                      </div>
                      <div className="p-3 rounded-lg bg-secondary/80 border border-border/50">
                        <div className="text-xl font-bold text-primary">{user.following}</div>
                        <div className="text-[10px] uppercase text-muted-foreground font-semibold">Following</div>
                      </div>
                      <div className="p-3 rounded-lg bg-secondary/80 border border-border/50">
                        <div className="text-xl font-bold text-primary">{user.public_repos}</div>
                        <div className="text-[10px] uppercase text-muted-foreground font-semibold">Repos</div>
                      </div>
                    </div>

                    <div className="space-y-3 text-sm text-muted-foreground">
                      {user.location && (
                        <div className="flex items-center gap-3">
                          <MapPin className="w-4 h-4 text-primary/70" /> {user.location}
                        </div>
                      )}
                      {user.blog && (
                        <div className="flex items-center gap-3">
                          <LinkIcon className="w-4 h-4 text-primary/70" />
                          <a href={user.blog.startsWith('http') ? user.blog : `https://${user.blog}`} target="_blank" rel="noreferrer" className="hover:text-primary transition-colors truncate">
                            {user.blog}
                          </a>
                        </div>
                      )}
                      {user.twitter_username && (
                        <div className="flex items-center gap-3">
                          <Twitter className="w-4 h-4 text-primary/70" /> @{user.twitter_username}
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-primary/70" /> Joined {new Date(user.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Top Languages Chart (Simplified) */}
                {topLanguages.length > 0 && (
                  <Card className="border-border bg-card/85 backdrop-blur-md shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Code className="w-4 h-4 text-primary" /> Top Languages
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {topLanguages.map(([lang, count]) => (
                        <div key={lang} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>{lang}</span>
                            <span className="text-muted-foreground">{(count / repos.length * 100).toFixed(0)}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary/90 rounded-full" 
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
                
                {/* Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard title="Total Stars" value={totalStars} icon={<Star className="w-4 h-4" />} />
                  <StatCard title="Public Repos" value={repos.length} icon={<Layers className="w-4 h-4" />} />
                  <StatCard title="Languages" value={Object.keys(languages).length} icon={<Code className="w-4 h-4" />} />
                  <StatCard title="Years Active" value={new Date().getFullYear() - new Date(user.created_at).getFullYear()} icon={<Calendar className="w-4 h-4" />} />
                </div>

                {/* Recent Activity */}
                <Card className="border-border bg-card/85 backdrop-blur-md shadow-sm">
                   <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Activity className="w-4 h-4 text-primary" /> Recent Activity
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
                                 <p className="text-foreground">
                                   <span className="font-semibold">{formatEventAction(event.type)}</span> in{" "}
                                   <span className="text-primary font-mono">{event.repo.name}</span>
                                 </p>
                                 <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(event.created_at))} ago</p>
                               </div>
                             </div>
                          )) : (
                            <p className="text-muted-foreground text-sm">No recent public activity found.</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                </Card>

                {/* Repositories Grid */}
                <div>
                   <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-primary" /> Active Repositories
                   </h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {repos.slice(0, 6).map((repo) => (
                        <Card key={repo.id} className="group border-border bg-card/90 hover:bg-card transition-colors backdrop-blur-sm shadow-sm hover:shadow-md">
                          <CardContent className="p-5">
                            <div className="flex justify-between items-start mb-2">
                              <a href={repo.html_url} target="_blank" className="font-semibold text-primary hover:underline truncate pr-4">
                                {repo.name}
                              </a>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground bg-secondary px-2 py-1 rounded border border-border/50">
                                <Star className="w-3 h-3 text-yellow-500" /> {repo.stargazers_count}
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2 h-10 mb-4">
                              {repo.description || "No description provided."}
                            </p>
                            <div className="flex justify-between items-center text-xs text-muted-foreground">
                               <div className="flex items-center gap-2">
                                  {repo.language && (
                                    <span className="flex items-center gap-1">
                                      <span className="w-2 h-2 rounded-full bg-primary/80"></span>
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
                   {repos.length > 6 && (
                     <div className="mt-4 text-center">
                       <Button variant="outline" asChild>
                          <a href={`https://github.com/${user.login}?tab=repositories`} target="_blank">View All on GitHub</a>
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
    <Card className="bg-card/90 border-border shadow-sm">
      <CardContent className="p-4 flex flex-col items-center justify-center text-center">
        <div className="text-muted-foreground mb-2 opacity-50">{icon}</div>
        <div className="text-2xl font-bold text-primary">{value}</div>
        <div className="text-xs uppercase text-muted-foreground font-medium tracking-wider">{title}</div>
      </CardContent>
    </Card>
  )
}

function getEventIcon(type: string) {
  switch (type) {
    case "PushEvent": return <GitCommit className="w-4 h-4 text-blue-400" />
    case "PullRequestEvent": return <GitBranch className="w-4 h-4 text-purple-400" />
    case "WatchEvent": return <Star className="w-4 h-4 text-yellow-400" />
    default: return <Activity className="w-4 h-4 text-gray-400" />
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
