"use client";

import { useState, FormEvent, useEffect } from "react";
import { searchJobsByFilters } from "@/services/jobApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  MapPin,
  Briefcase,
  Clock,
  DollarSign,
  Filter,
  ExternalLink,
  X,
} from "lucide-react";
// Import ISO-country data
import { countries as countryData } from "countries-list";

const countryOptions = Object.entries(countryData).map(
  ([code, { name }]) => ({ code, name })
);

interface Job {
  id: string;
  title: string;
  description: string;
  company: { name: string; logo_url?: string };
  location: string;
  remote: boolean;
  employment_type: string;
  salary?: { min: number; max: number; currency: string };
  created_at: string;
  url: string;
  tags: string[];
}

interface SearchFilters {
  remote?: boolean;
  employmentTypes?: string[];
  locations?: string[];
  postedWithin?: string;
  countries?: string[];
}

export default function JobsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});
  const perPage = 9;
  const [countrySearch, setCountrySearch] = useState("");
  const [filteredCountries, setFilteredCountries] = useState(countryOptions);

  const employmentTypeOptions = [
    { label: "Full-time",  value: "FULL_TIME" },
    { label: "Part-time",  value: "PART_TIME" },
    { label: "Contract",   value: "CONTRACT" },
    { label: "Temporary",  value: "TEMPORARY" },
    { label: "Internship", value: "INTERNSHIP" },
  ];

  const timeFrameOptions = [
    { label: "Last 24 hours", value: "1d" },
    { label: "Last 7 days",   value: "7d" },
    { label: "Last 14 days",  value: "14d" },
    { label: "Last 30 days",  value: "30d" },
  ];

  // Toggle a country in filters.countries
  const toggleCountry = (code: string) => {
    setFilters(prev => {
      const arr = prev.countries || [];
      return {
        ...prev,
        countries: arr.includes(code)
          ? arr.filter(c => c !== code)
          : [...arr, code],
      };
    });
  };

  // Filter countries based on search input
  useEffect(() => {
    if (!countrySearch.trim()) {
      setFilteredCountries(countryOptions);
    } else {
      const searchLower = countrySearch.toLowerCase();
      setFilteredCountries(
        countryOptions.filter(
          ({ name, code }) => 
            name.toLowerCase().includes(searchLower) || 
            code.toLowerCase().includes(searchLower)
        )
      );
    }
  }, [countrySearch]);

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError("");
    setPage(1);

    try {
      const result = await searchJobsByFilters(1, perPage, filters);
      console.log("API Response:", result);

      if (Array.isArray(result.data)) {
        setJobs(result.data);
        setTotalJobs(result.metadata.total_results ?? result.data.length);
      } else {
        setJobs([]);
        setTotalJobs(0);
        setError("Unexpected API response format.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to fetch jobs.");
    } finally {
      setLoading(false);
    }
  };

  const loadMoreJobs = async () => {
    if (loading || jobs.length >= totalJobs) return;
    setLoading(true);

    try {
      const next = page + 1;
      const result = await searchJobsByFilters(next, perPage, filters);
      if (Array.isArray(result.data)) {
        setJobs(prev => [...prev, ...result.data]);
        setPage(next);
      } else {
        setError("Unexpected response format.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load more jobs.");
    } finally {
      setLoading(false);
    }
  };

  const formatSalary = (j: Job) => {
    if (!j.salary) return null;
    const cur = j.salary.currency || "$";
    if (j.salary.min && j.salary.max) {
      return `${cur}${j.salary.min.toLocaleString()} - ${cur}${j.salary.max.toLocaleString()}`;
    } else if (j.salary.min) {
      return `${cur}${j.salary.min.toLocaleString()}+`;
    } else if (j.salary.max) {
      return `Up to ${cur}${j.salary.max.toLocaleString()}`;
    }
    return null;
  };

  const formatEmpType = (type: string) =>
    type
      .split("_")
      .map(w => w[0] + w.slice(1).toLowerCase())
      .join(" ");

  const toggleEmploymentType = (t: string) =>
    setFilters(prev => {
      const arr = prev.employmentTypes || [];
      return {
        ...prev,
        employmentTypes: arr.includes(t)
          ? arr.filter(x => x !== t)
          : [...arr, t],
      };
    });

  const toggleRemote = () =>
    setFilters(prev => ({ ...prev, remote: !prev.remote }));

  const setPostedWithin = (v: string) =>
    setFilters(prev => ({ ...prev, postedWithin: v }));

  const clearAllFilters = () => setFilters({});

  const activeCount = Object.values(filters).filter(v =>
    Array.isArray(v) ? v.length > 0 : v !== undefined
  ).length;

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center">
        Find Inclusive Jobs
      </h1>

      <div className="mb-8 max-w-3xl mx-auto">
        <form onSubmit={handleSearch} className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              type="text"
              placeholder="Job title, keywords, or company"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="flex-grow"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => setFiltersOpen(o => !o)}
              className="gap-2"
            >
              <Filter size={18} />
              Filters
              {activeCount > 0 && (
                <Badge className="ml-1 bg-teal-600 text-white">
                  {activeCount}
                </Badge>
              )}
            </Button>
            <Button
              type="submit"
              className="bg-teal-600 hover:bg-teal-700"
              disabled={loading}
            >
              {loading && !jobs.length ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                "Search Jobs"
              )}
            </Button>
          </div>

          {filtersOpen && (
            <div className="bg-white p-4 rounded-md shadow-sm border mt-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">Filter Jobs</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="h-8 text-sm"
                >
                  Clear All
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Job Type */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Job Type</h4>
                  <div className="space-y-2">
                    {employmentTypeOptions.map(opt => (
                      <label key={opt.value} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={filters.employmentTypes?.includes(opt.value) || false}
                          onChange={() => toggleEmploymentType(opt.value)}
                          className="rounded text-teal-600 focus:ring-teal-600"
                        />
                        <span>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Remote */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Remote Work</h4>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filters.remote || false}
                      onChange={toggleRemote}
                      className="rounded text-teal-600 focus:ring-teal-600"
                    />
                    <span>Remote only</span>
                  </label>
                </div>

                {/* Date Posted */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Date Posted</h4>
                  <div className="space-y-2">
                    {timeFrameOptions.map(opt => (
                      <label key={opt.value} className="flex items-center gap-2">
                        <input
                          type="radio"
                          checked={filters.postedWithin === opt.value}
                          onChange={() => setPostedWithin(opt.value)}
                          className="text-teal-600 focus:ring-teal-600"
                        />
                        <span>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Countries */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Countries</h4>
                  <Input
                    type="text"
                    placeholder="Search countries..."
                    value={countrySearch}
                    onChange={(e) => setCountrySearch(e.target.value)}
                    className="mb-2"
                  />
                  
                  {/* Selected countries display */}
                  {filters.countries && filters.countries.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {filters.countries.map(code => {
                        const country = countryOptions.find(c => c.code === code);
                        return (
                          <Badge 
                            key={code} 
                            variant="secondary" 
                            className="flex items-center gap-1 text-xs"
                          >
                            {country ? country.name : code}
                            <button 
                              onClick={() => toggleCountry(code)} 
                              className="ml-1"
                            >
                              <X size={12} />
                            </button>
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                  
                  <div className="h-40 overflow-auto border p-2 rounded">
                    {filteredCountries.length > 0 ? (
                      filteredCountries.map(({ code, name }) => (
                        <label key={code} className="flex items-center gap-2 hover:bg-gray-50 px-1 py-0.5 rounded">
                          <input
                            type="checkbox"
                            checked={filters.countries?.includes(code) || false}
                            onChange={() => toggleCountry(code)}
                            className="rounded text-teal-600 focus:ring-teal-600"
                          />
                          <span className="text-sm">{name}</span>
                          <span className="text-xs text-gray-500">{code}</span>
                        </label>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 p-2">No countries found</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>

        {error && (
          <div className="text-red-500 text-center mb-4">
            {error}
          </div>
        )}
      </div>

      {/* Active filter badges */}
      {activeCount > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {filters.remote && (
            <Badge variant="outline" className="flex items-center gap-1">
              Remote Only
              <button onClick={toggleRemote} className="ml-1">
                <X size={14} />
              </button>
            </Badge>
          )}
          {filters.employmentTypes?.map(t => {
            const lbl = employmentTypeOptions.find(o => o.value === t)?.label || t;
            return (
              <Badge key={t} variant="outline" className="flex items-center gap-1">
                {lbl}
                <button onClick={() => toggleEmploymentType(t)} className="ml-1">
                  <X size={14} />
                </button>
              </Badge>
            );
          })}
          {filters.postedWithin && (
            <Badge variant="outline" className="flex items-center gap-1">
              {timeFrameOptions.find(o => o.value === filters.postedWithin)?.label}
              <button onClick={() => setPostedWithin("")} className="ml-1">
                <X size={14} />
              </button>
            </Badge>
          )}
          {filters.countries?.map(cc => (
            <Badge key={cc} variant="outline" className="flex items-center gap-1">
              {cc}
              <button
                onClick={() =>
                  setFilters(prev => ({
                    ...prev,
                    countries: prev.countries!.filter(c => c !== cc),
                  }))
                }
                className="ml-1"
              >
                <X size={14} />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Job cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {jobs.map(job => (
          <Card key={job.id} className="h-full flex flex-col">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="line-clamp-2">{job.title}</CardTitle>
                  <CardDescription className="mt-1">
                    {job.company.name}
                  </CardDescription>
                </div>
                {job.company.logo_url && (
                  <img
                    src={job.company.logo_url}
                    alt={`${job.company.name} logo`}
                    className="h-10 w-10 object-contain"
                  />
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="space-y-2 text-sm">
                {job.location && (
                  <div className="flex items-center">
                    <MapPin size={16} className="mr-2 text-gray-500" />
                    <span>{job.location}</span>
                  </div>
                )}
                {job.employment_type && (
                  <div className="flex items-center">
                    <Briefcase size={16} className="mr-2 text-gray-500" />
                    <span>{formatEmpType(job.employment_type)}</span>
                  </div>
                )}
                {formatSalary(job) && (
                  <div className="flex items-center">
                    <DollarSign size={16} className="mr-2 text-gray-500" />
                    <span>{formatSalary(job)}</span>
                  </div>
                )}
                <div className="flex items-center">
                  <Clock size={16} className="mr-2 text-gray-500" />
                  <span>Posted {new Date(job.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              {job.description && (
                <div className="mt-4">
                  <h4 className="font-semibold text-sm mb-2">Description:</h4>
                  <p className="text-sm line-clamp-3">{job.description}</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t pt-4 flex flex-col gap-2">
              <div className="flex flex-wrap gap-2 w-full">
                {job.remote && (
                  <Badge variant="outline" className="bg-blue-50">
                    Remote
                  </Badge>
                )}
                {job.tags?.slice(0, 3).map((tag, i) => (
                  <Badge key={i} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
              <Button
                variant="outline"
                className="w-full mt-2 flex items-center justify-center gap-2 text-teal-600 border-teal-600"
                onClick={() => window.open(job.url, "_blank")}
              >
                Apply Now
                <ExternalLink size={16} />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {jobs.length > 0 && jobs.length < totalJobs && (
        <div className="mt-8 text-center">
          <Button onClick={loadMoreJobs} disabled={loading} variant="outline">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
                "Load More Jobs"
              )}
          </Button>
        </div>
      )}

      {jobs.length === 0 && !loading && searchQuery && (
        <div className="text-center text-gray-500 mt-10">
          No jobs found. Try different keywords or filters.
        </div>
      )}

      {!searchQuery && !loading && (
        <div className="text-center text-gray-500 mt-10">
          Enter keywords to search for jobs
        </div>
      )}
    </div>
  );
}
