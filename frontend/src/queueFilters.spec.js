import { describe, expect, it } from 'vitest'
import { DEFAULT_FILTERS, filtersFromQuery, queryFromFilters } from './queueFilters'

describe('queueFilters', () => {
  it('ignores invalid URL values and round-trips valid filters', () => {
    expect(filtersFromQuery({ status: 'banana', sort: 'risk', flagged: 'yes' })).toEqual(DEFAULT_FILTERS)
    expect(queryFromFilters(DEFAULT_FILTERS)).toEqual({})

    const filters = { status: 'reviewed', search: 'video', sort: 'newest', flaggedOnly: true }
    expect(queryFromFilters(filters)).toEqual({ status: 'reviewed', search: 'video', sort: 'newest', flagged: '1' })
    expect(filtersFromQuery(queryFromFilters(filters))).toEqual(filters)
  })
})
