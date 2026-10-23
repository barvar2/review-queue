import { request } from './client'

export async function fetchItems(query, cursor) {
  const params = new URLSearchParams(query)

  if (cursor) params.set('cursor', cursor)

  const { data, meta } = await request('GET', `/items?${params}`)
  return { items: data, nextCursor: meta.next_cursor, total: meta.total, totalCapped: meta.total_capped, pageSize: meta.per_page }
}

export async function fetchItem(id) {
  const { data } = await request('GET', `/items/${id}`)
  return data
}

export async function reviewItem(id, review) {
  const { data } = await request('POST', `/items/${id}/review`, review)
  return data
}

export async function createItem(item) {
  const { data } = await request('POST', '/items', item)
  return data
}
