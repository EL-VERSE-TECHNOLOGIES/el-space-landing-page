'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Briefcase, DollarSign, Calendar, MapPin, Users } from 'lucide-react';

export default function JobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/projects');
      const data = await response.json();
      setJobs(data.projects || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || job.category === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Available Jobs</h1>
          <p className="text-slate-400">Find your next freelance opportunity</p>
        </div>

        {/* Search & Filter */}
        <div className="mb-8 space-y-4">
          <div className="flex gap-4">
            <Input
              placeholder="Search jobs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
            />
            <Button
              onClick={() => router.push('/jobs/post')}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
            >
              Post a Job
            </Button>
          </div>

          {/* Category Filter */}
          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList className="bg-slate-800 border border-slate-700">
              <TabsTrigger value="all">All Categories</TabsTrigger>
              <TabsTrigger value="Development">Development</TabsTrigger>
              <TabsTrigger value="Design">Design</TabsTrigger>
              <TabsTrigger value="Marketing">Marketing</TabsTrigger>
              <TabsTrigger value="Writing">Writing</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Jobs Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin h-8 w-8 border-2 border-cyan-500 border-t-transparent rounded-full"></div>
          </div>
        ) : filteredJobs.length === 0 ? (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="py-12 text-center">
              <Briefcase className="mx-auto h-12 w-12 text-slate-600 mb-4" />
              <p className="text-slate-400">No jobs found matching your criteria</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {filteredJobs.map((job) => (
              <Card key={job.id} className="bg-slate-800 border-slate-700 hover:border-cyan-500 transition-colors cursor-pointer">
                <CardHeader onClick={() => router.push(`/jobs/${job.id}`)}>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-white">{job.title}</CardTitle>
                      <CardDescription className="text-slate-400">Posted by {job.client_id}</CardDescription>
                    </div>
                    <Badge className="bg-cyan-500/20 text-cyan-300">{job.category}</Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <p className="text-slate-300 line-clamp-2">{job.description}</p>

                  {/* Skills */}
                  {job.required_skills && job.required_skills.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {job.required_skills.slice(0, 3).map((skill: string) => (
                        <Badge key={skill} variant="secondary" className="bg-slate-700 text-slate-200">
                          {skill}
                        </Badge>
                      ))}
                      {job.required_skills.length > 3 && (
                        <Badge variant="secondary" className="bg-slate-700 text-slate-200">
                          +{job.required_skills.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Job Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-700">
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <DollarSign className="h-4 w-4" />
                      <span>${job.budget_min} - ${job.budget_max}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Calendar className="h-4 w-4" />
                      <span>{job.timeline}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Users className="h-4 w-4" />
                      <span>Applications: 0</span>
                    </div>
                  </div>

                  <Button
                    onClick={() => router.push(`/jobs/${job.id}`)}
                    className="w-full bg-cyan-500 hover:bg-cyan-600 text-white"
                  >
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
