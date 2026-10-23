import { MESSAGES } from './constants/messages'

export const STATUS_OPTIONS = [
  { value: 'pending', label: MESSAGES.filters.statusTabs.pending },
  { value: 'reviewed', label: MESSAGES.filters.statusTabs.reviewed },
  { value: 'all', label: MESSAGES.filters.statusTabs.all }
]

export const SORT_OPTIONS = [
  { value: 'oldest', label: MESSAGES.filters.sortOptions.oldest },
  { value: 'newest', label: MESSAGES.filters.sortOptions.newest }
]

export const DEFAULT_FILTERS = {
  status: 'pending',
  search: '',
  sort: 'oldest',
  flaggedOnly: false
}

function isOption(options, value) {
  return options.some(option => option.value === value)
}

export function filtersFromQuery(query) {
  return {
    status: isOption(STATUS_OPTIONS, query.status) ? query.status : DEFAULT_FILTERS.status,
    search: typeof query.search === 'string' ? query.search : DEFAULT_FILTERS.search,
    sort: isOption(SORT_OPTIONS, query.sort) ? query.sort : DEFAULT_FILTERS.sort,
    flaggedOnly: query.flagged === '1'
  }
}

export function queryFromFilters(filters) {
  const query = {}
  const search = filters.search.trim()

  if (filters.status !== DEFAULT_FILTERS.status) query.status = filters.status
  if (search) query.search = search
  if (filters.sort !== DEFAULT_FILTERS.sort) query.sort = filters.sort
  if (filters.flaggedOnly) query.flagged = '1'

  return query
}
