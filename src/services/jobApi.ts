// src/services/jobApi.ts
import axios from 'axios';

const API_KEY = '';

  // keep yours here

// — Jobs endpoints live under v1
const jobsClient = axios.create({
  baseURL: 'https://api.theirstack.com/v1',
  headers: {
    Authorization: `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
  },
});

// — Catalog endpoints live under v0
const catalogClient = axios.create({
  baseURL: 'https://api.theirstack.com/v0',
  headers: {
    Authorization: `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
  },
});

/**
 * Simple keyword search
 */
export const searchJobs = async (
  query: string,
  page = 1,
  perPage = 10
) => {
  try {
    const payload = {
      offset: (page - 1) * perPage,
      limit: perPage,
      search: query,
    };

    const { data } = await jobsClient.post('/jobs/search', payload);
    return data;
  } catch (err) {
    console.error('Error searching jobs:', err);
    throw err;
  }
};

/**
 * Search with optional filters
 */
type Filters = {
  remote?: boolean;
  employmentTypes?: string[];
  locations?: string[];
  companies?: string[];
  skills?: string[];
  salaryMin?: number;
  salaryMax?: number;
  postedWithinDays?: number;     // in days, e.g. 30
  jobTitles?: string[];          // for job_title_or
  companyNames?: string[];       // for company_name_or
};

export const searchJobsByFilters = async (
    page = 1,
    perPage = 10,
    filters: Filters = {}
) => {
    try {
        // build payload
      const payload: Record<string, any> = {
        page: page - 1,
        limit: perPage,
        // your “required” date filter or job_title_or, etc.
        posted_at_max_age_days: filters.postedWithinDays ?? 30,
        // …
      };

      // other filters
      if (filters.remote !== undefined) payload.remote = filters.remote;
      if (filters.employmentTypes?.length)
        payload.employment_type = filters.employmentTypes;
      if (filters.locations?.length) payload.location_or = filters.locations;
      if (filters.companies?.length) payload.company_name_or = filters.companies;
      if (filters.skills?.length) payload.skills = filters.skills;

      // 🎯 salary: only add if **both** present
      if (
        filters.salaryMin != null &&
        filters.salaryMax != null
      ) {
        payload.salary_min = filters.salaryMin;
        payload.salary_max = filters.salaryMax;
      }

      // now POST
      console.log("Final payload:", payload);
      const { data } = await jobsClient.post("/jobs/search", payload);
      return data;

    } catch (err: any) {
        if (axios.isAxiosError(err) && err.response) {
            console.error("TheirStack validation errors:", err.response.data.detail);
            // Now re-throw or return a user-friendly message
            throw err;
        }
        throw err;
    };
};

/**
 * Get the full details for one job
 */
export const getJobDetails = async (jobId: string) => {
  try {
    const { data } = await jobsClient.get(`/jobs/${jobId}`);
    return data;
  } catch (err) {
    console.error('Error getting job details:', err);
    throw err;
  }
};

/**
 * Catalog endpoint: for each job title + country, how many companies posted it
 */
export const getCompaniesPerJobByCountry = async (
  limit = 100,
  offset = 0
) => {
  try {
    const { data } = await catalogClient.get(
      '/catalog/jobs_companies_per_job_country_code',
      { params: { limit, offset } }
    );
    return data;
  } catch (err) {
    console.error(
      'Error fetching companies-per-job-by-country:',
      err
    );
    throw err;
  }
};

export default {
  searchJobs,
  searchJobsByFilters,
  getJobDetails,
  getCompaniesPerJobByCountry,
};
