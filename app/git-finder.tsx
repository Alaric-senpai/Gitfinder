"use client"

import type React from "react"

import { Octokit } from "octokit"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Search,
  GitBranch,
  Star,
  AlertCircle,
  ExternalLink,
  MapPin,
  Building,
  Calendar,
  ArrowLeft,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"

export default function GitFinder() {
  const [octokit, setOctokit] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [user, setUser] = useState<any>(null)
  const [repos, setRepos] = useState<any[]>([])
  const [issues, setIssues] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [loading, setLoading] = useState(false)
  const [reposLoading, setReposLoading] = useState(false)
  const [issuesLoading, setIssuesLoading] = useState(false)

  useEffect(() => {
    // Initialize Octokit once when component mounts
    setOctokit(new Octokit())
  }, [])

  // Reset all state
  const resetPage = () => {
    setUser(null)
    setRepos([])
    setIssues([])
    setError(null)
    setShowDetails(false)
  }

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  // Handle form submit
  const handleForm = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!searchQuery.trim()) return

    setLoading(true)
    try {
      resetPage()
      const { data } = await octokit.rest.users.getByUsername({ username: searchQuery })
      setUser(data)
    } catch (err: any) {
      setError(err.status === 404 ? "User not found!" : "An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Fetch Repositories
  const fetchRepos = async () => {
    if (!user) return

    setReposLoading(true)
    try {
      const { data } = await octokit.rest.repos.listForUser({
        username: user.login,
        per_page: 15,
        sort: "updated",
        direction: "desc",
      })
      setRepos(data)
    } catch (err) {
      console.error("Error fetching repositories:", err)
    } finally {
      setReposLoading(false)
    }
  }

  // Fetch Issues
  const fetchIssues = async () => {
    if (!user) return

    setIssuesLoading(true)
    try {
      const { data } = await octokit.rest.search.issuesAndPullRequests({
        q: `author:${user.login} type:issue state:open`,
        per_page: 5,
      })
      setIssues(data.items)
    } catch (err) {
      console.error("Error fetching issues:", err)
    } finally {
      setIssuesLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 text-white p-4 md:p-8">
      <div
        className={cn(
          "max-w-7xl mx-auto grid gap-6 transition-all duration-300",
          showDetails ? "grid-cols-1 lg:grid-cols-[1fr_1.5fr]" : "grid-cols-1",
        )}
      >
        {/* Left Side: Search & User Info */}
        <div className="flex flex-col items-center">
          <div className="w-full max-w-md">
            <h1 className="font-bold text-4xl md:text-6xl my-7 flex items-center gap-2 justify-center">
              <span className="bg-emerald-500/20 p-3 rounded-md text-emerald-400">GIT</span>
              <span>Finder</span>
            </h1>

            <Card className="bg-gray-800/50 border-gray-700 shadow-xl backdrop-blur-sm">
              <CardContent className="pt-6">
                <form onSubmit={handleForm} className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      name="query"
                      value={searchQuery}
                      onChange={handleChange}
                      className="pl-9 bg-gray-900/70 border-gray-700 text-white placeholder:text-gray-500 focus-visible:ring-emerald-500/50"
                      placeholder="Enter GitHub username"
                    />
                  </div>
                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {error && (
              <Card className="mt-4 bg-red-900/20 border-red-800 text-red-300">
                <CardContent className="flex items-center gap-2 p-4">
                  <AlertCircle className="h-5 w-5" />
                  <p>{error}</p>
                </CardContent>
              </Card>
            )}

            {user && !showDetails && (
              <Card className="mt-6 bg-gray-800/50 border-gray-700 shadow-xl overflow-hidden backdrop-blur-sm">
                <CardContent className="pt-6 flex flex-col items-center">
                  <Avatar className="h-24 w-24 border-2 border-emerald-500/30">
                    <AvatarImage src={user.avatar_url} alt={user.login} />
                    <AvatarFallback className="bg-emerald-900 text-emerald-200 text-xl">
                      {user.login.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <h2 className="text-2xl font-semibold mt-4">{user.name || user.login}</h2>
                  <a
                    href={user.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-400 text-sm flex items-center gap-1 mt-1 hover:underline"
                  >
                    @{user.login} <ExternalLink className="h-3 w-3" />
                  </a>

                  {user.bio && <p className="text-gray-300 text-center mt-3 text-sm">{user.bio}</p>}

                  <div className="flex gap-4 mt-4 text-sm">
                    <div className="text-center">
                      <p className="font-bold">{user.followers.toLocaleString()}</p>
                      <p className="text-gray-400">Followers</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold">{user.following.toLocaleString()}</p>
                      <p className="text-gray-400">Following</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold">{user.public_repos.toLocaleString()}</p>
                      <p className="text-gray-400">Repos</p>
                    </div>
                  </div>

                  <Button
                    onClick={() => setShowDetails(true)}
                    className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white w-full"
                  >
                    View Full Profile
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Right Side: Detailed Profile */}
        {showDetails && user && (
          <div className="w-full">
            <Card className="bg-gray-800/50 border-gray-700 shadow-xl backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowDetails(false)}
                  className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-700"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <CardTitle className="text-xl text-emerald-400">GitHub Profile</CardTitle>
              </CardHeader>

              <Tabs defaultValue="profile" className="w-full">
                <CardContent className="pb-0">
                  <TabsList className="w-full bg-gray-900/70 p-1">
                    <TabsTrigger value="profile" className="data-[state=active]:bg-emerald-600">
                      Profile
                    </TabsTrigger>
                    <TabsTrigger value="repos" onClick={fetchRepos} className="data-[state=active]:bg-emerald-600">
                      Repositories
                    </TabsTrigger>
                    <TabsTrigger value="issues" onClick={fetchIssues} className="data-[state=active]:bg-emerald-600">
                      Issues
                    </TabsTrigger>
                  </TabsList>
                </CardContent>

                <CardContent className="pt-6">
                  {/* Profile Tab */}
                  <TabsContent value="profile" className="mt-0">
                    <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                      <Avatar className="h-32 w-32 border-2 border-emerald-500/30">
                        <AvatarImage src={user.avatar_url} alt={user.login} />
                        <AvatarFallback className="bg-emerald-900 text-emerald-200 text-3xl">
                          {user.login.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 space-y-4">
                        <div className="text-center md:text-left">
                          <h2 className="text-3xl font-bold text-emerald-300">{user.name || user.login}</h2>
                          <a
                            href={user.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-400 flex items-center gap-1 mt-1 hover:underline justify-center md:justify-start"
                          >
                            @{user.login} <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>

                        {user.bio && <p className="text-gray-300">{user.bio}</p>}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          {user.company && (
                            <div className="flex items-center gap-2 text-gray-300">
                              <Building className="h-4 w-4 text-gray-400" />
                              <span>{user.company}</span>
                            </div>
                          )}

                          {user.location && (
                            <div className="flex items-center gap-2 text-gray-300">
                              <MapPin className="h-4 w-4 text-gray-400" />
                              <span>{user.location}</span>
                            </div>
                          )}

                          {user.created_at && (
                            <div className="flex items-center gap-2 text-gray-300">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm">
                          <div className="bg-gray-900/70 px-3 py-2 rounded-md">
                            <p className="font-bold text-blue-300 ">{user.followers.toLocaleString()}</p>
                            <p className="text-gray-400">Followers</p>
                          </div>
                          <div className="bg-gray-900/70 px-3 py-2 rounded-md">
                            <p className="font-bold text-blue-300">{user.following.toLocaleString()}</p>
                            <p className="text-gray-400">Following</p>
                          </div>
                          <div className="bg-gray-900/70 px-3 py-2 rounded-md">
                            <p className="font-bold text-blue-300">{user.public_repos.toLocaleString()}</p>
                            <p className="text-gray-400">Repositories</p>
                          </div>
                          <div className="bg-gray-900/70 px-3 py-2 rounded-md">
                            <p className="font-bold text-blue-300">{user.public_gists.toLocaleString()}</p>
                            <p className="text-gray-400">Gists</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Repositories Tab */}
                  <TabsContent value="repos" className="mt-0">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <GitBranch className="h-5 w-5 text-emerald-400" />
                      <span className="text-green-500">
                        Latest Repositories
                      </span>
                    </h3>

                    {reposLoading ? (
                      <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="border border-gray-700 rounded-md p-4">
                            <Skeleton className="h-6 w-48 bg-gray-700" />
                            <Skeleton className="h-4 w-full mt-2 bg-gray-700" />
                            <div className="flex gap-3 mt-3">
                              <Skeleton className="h-5 w-16 bg-gray-700" />
                              <Skeleton className="h-5 w-16 bg-gray-700" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : repos.length > 0 ? (
                      <div className="space-y-4">
                        {repos.map((repo) => (
                          <Card key={repo.id} className="bg-gray-900/70 border-gray-700">
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start">
                                <a
                                  href={repo.html_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-emerald-400 font-semibold text-lg hover:underline flex items-center gap-1"
                                >
                                  {repo.name}
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                                <div className="flex items-center gap-1 text-yellow-400">
                                  <Star className="h-4 w-4" />
                                  <span>{repo.stargazers_count}</span>
                                </div>
                              </div>

                              {repo.description && <p className="text-gray-300 text-sm mt-2">{repo.description}</p>}

                              <div className="flex flex-wrap gap-2 mt-3">
                                {repo.language && (
                                  <Badge variant="outline" className="bg-gray-800 text-white text-xs">
                                    {repo.language}
                                  </Badge>
                                )}
                                <Badge variant="outline" className="bg-gray-800 text-white text-xs">
                                  Updated {formatDistanceToNow(new Date(repo.updated_at))} ago
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <GitBranch className="h-12 w-12 mx-auto mb-3 opacity-20" />
                        <p>No repositories found</p>
                      </div>
                    )}

                    {repos.length > 0 && (
                      <div className="mt-4 text-center">
                        <a
                          href={`https://github.com/${user.login}?tab=repositories`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-400 hover:underline inline-flex items-center gap-1"
                        >
                          View all repositories <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </TabsContent>

                  {/* Issues Tab */}
                  <TabsContent value="issues" className="mt-0">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-emerald-400" />
                      <span className="text-green-500">
                        Open Issues
                      </span>
                    </h3>

                    {issuesLoading ? (
                      <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="border border-gray-700 rounded-md p-4">
                            <Skeleton className="h-6 w-full bg-gray-700" />
                            <div className="flex gap-3 mt-3">
                              <Skeleton className="h-5 w-16 bg-gray-700" />
                              <Skeleton className="h-5 w-24 bg-gray-700" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : issues.length > 0 ? (
                      <div className="space-y-4">
                        {issues.map((issue) => (
                          <Card key={issue.id} className="bg-gray-900/70 border-gray-700">
                            <CardContent className="p-4">
                              <a
                                href={issue.html_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-400 font-semibold hover:underline flex items-center gap-1"
                              >
                                {issue.title}
                                <ExternalLink className="h-3 w-3" />
                              </a>

                              <div className="flex flex-wrap gap-2 mt-2 text-sm">
                                <Badge className="bg-emerald-900/50 text-emerald-300 hover:bg-emerald-900/70">
                                  #{issue.number}
                                </Badge>
                                <span className="text-gray-400">
                                  Opened {formatDistanceToNow(new Date(issue.created_at))} ago
                                </span>
                              </div>

                              {issue.repository_url && (
                                <div className="mt-2 text-sm text-gray-400">
                                  in repository: {issue.repository_url.split("/").slice(-1)}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-20" />
                        <p>No open issues found</p>
                      </div>
                    )}
                  </TabsContent>
                </CardContent>
              </Tabs>

              <CardFooter className="text-xs text-gray-500 justify-center pt-2 pb-4">
                Data provided by GitHub API • {new Date().toLocaleDateString()}
              </CardFooter>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

