import { createLocalVue, mount } from '@vue/test-utils'
import VueRouter from 'vue-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ElementPlugin from '../plugins/element'
import App from '../App.vue'
import { ApiError } from '../api/client'
import { fetchItem, fetchItems, reviewItem } from '../api/items'
import { routes } from '../router'
import QueueView from './QueueView.vue'

vi.mock('../api/items', () => ({ fetchItems: vi.fn(), fetchItem: vi.fn(), reviewItem: vi.fn() }))

const localVue = createLocalVue()
localVue.use(VueRouter)
localVue.use(ElementPlugin)

function item(id, status = 'pending') {
  return { id, title: `Item ${id}`, excerpt: '', body: 'Body', status, flags: [], review_note: null, reviewed_at: null, created_at: '2026-10-22T10:00:00Z' }
}

function page(items, nextCursor = null, total = items.length, pageSize = 25, totalCapped = false) {
  return { items, nextCursor, total, pageSize, totalCapped }
}

function range(first, last) {
  return Array.from({ length: last - first + 1 }, (_, offset) => item(first + offset))
}

async function approveSelected(wrapper) {
  await wrapper.findAll('.review-form button').wrappers.find(button => button.text() === 'Approve').trigger('click')
  await flushPromises()
}

function flushPromises() {
  return new Promise(resolve => setTimeout(resolve))
}

function mountApp(path = '/') {
  const router = new VueRouter({ mode: 'abstract', routes })
  router.push(path)
  return mount(App, { localVue, router, attachTo: document.body })
}

function titles(wrapper) {
  return wrapper.findAll('.queue-item__title').wrappers.map(title => title.text())
}

function pagerButton(wrapper, label) {
  return wrapper.findAll('.queue__pager button').wrappers.find(button => button.text() === label)
}

describe('QueueView', () => {
  afterEach(() => {
    vi.resetAllMocks()
    document.body.innerHTML = ''
  })

  it('renders the first page and stops loading', async () => {
    fetchItems.mockResolvedValue(page([item(1), item(2)]))

    const wrapper = mountApp()
    await flushPromises()

    expect(fetchItems).toHaveBeenCalledWith({}, null)
    expect(titles(wrapper)).toEqual(['Item 1', 'Item 2'])
    expect(wrapper.findComponent(QueueView).vm.loading).toBe(false)
    wrapper.destroy()
  })

  it('ignores an older response that arrives after a newer one', async () => {
    let resolvePending
    fetchItems
      .mockReturnValueOnce(new Promise(resolve => { resolvePending = resolve }))
      .mockResolvedValueOnce(page([item(2, 'approved')]))

    const wrapper = mountApp()
    await wrapper.vm.$router.push({ query: { status: 'reviewed' } })
    await flushPromises()
    resolvePending(page([item(1)]))
    await flushPromises()

    expect(titles(wrapper)).toEqual(['Item 2'])
    wrapper.destroy()
  })

  it('shows one page at a time: Next replaces the list and Previous returns to the earlier page', async () => {
    const pages = {
      first: page([item(1), item(2)], 'after-2', 5, 2),
      'after-2': page([item(3), item(4)], 'after-4', 5, 2),
      'after-4': page([item(5)], null, 5, 2)
    }
    fetchItems.mockImplementation(async (query, cursor) => pages[cursor || 'first'])

    const wrapper = mountApp()
    await flushPromises()
    expect(pagerButton(wrapper, 'Previous').attributes('disabled')).toBe('disabled')

    await pagerButton(wrapper, 'Next').trigger('click')
    await flushPromises()
    expect(titles(wrapper)).toEqual(['Item 3', 'Item 4'])
    await pagerButton(wrapper, 'Next').trigger('click')
    await flushPromises()
    expect(titles(wrapper)).toEqual(['Item 5'])
    expect(wrapper.find('.queue__count').text()).toBe('Page 3 of 3 · 5 items')
    expect(pagerButton(wrapper, 'Next').attributes('disabled')).toBe('disabled')

    await pagerButton(wrapper, 'Previous').trigger('click')
    await flushPromises()
    expect(fetchItems).toHaveBeenLastCalledWith({}, 'after-2')
    expect(titles(wrapper)).toEqual(['Item 3', 'Item 4'])

    await pagerButton(wrapper, 'Previous').trigger('click')
    await flushPromises()
    expect(fetchItems).toHaveBeenLastCalledWith({}, null)
    expect(titles(wrapper)).toEqual(['Item 1', 'Item 2'])
    expect(pagerButton(wrapper, 'Previous').attributes('disabled')).toBe('disabled')
    wrapper.destroy()
  })

  it('keeps counting the next page after a review shrinks the total, because cursor pages keep their boundaries', async () => {
    fetchItems.mockResolvedValue(page(range(1, 25), 'after-25', 26))
    fetchItem.mockImplementation(async id => item(id))
    reviewItem.mockImplementation(async id => item(id, 'approved'))

    const wrapper = mountApp('/items/1')
    await flushPromises()
    expect(wrapper.find('.queue__count').text()).toBe('Page 1 of 2 · 26 items')

    await approveSelected(wrapper)

    expect(wrapper.find('.queue__count').text()).toBe('Page 1 of 2 · 25 items')
    wrapper.destroy()
  })

  it('never shows fewer pages than Next can reach, even when the total lags behind', async () => {
    fetchItems.mockResolvedValue(page(range(1, 25), 'after-25', 25))

    const wrapper = mountApp()
    await flushPromises()

    expect(wrapper.find('.queue__count').text()).toBe('Page 1 of 2 · 25 items')
    wrapper.destroy()
  })

  it('qualifies a capped total and keeps it after reviews', async () => {
    fetchItems.mockResolvedValue(page(range(1, 25), 'after-25', 1000, 25, true))
    fetchItem.mockImplementation(async id => item(id))
    reviewItem.mockImplementation(async id => item(id, 'approved'))

    const wrapper = mountApp('/items/1')
    await flushPromises()
    expect(wrapper.find('.queue__count').text()).toBe('Page 1 of 40+ · 1,000+ items')

    await approveSelected(wrapper)

    expect(wrapper.find('.queue__count').text()).toBe('Page 1 of 40+ · 1,000+ items')
    wrapper.destroy()
  })

  it('returns to the first page when a filter changes, ignoring the page still loading', async () => {
    let resolveOldPage
    fetchItems
      .mockResolvedValueOnce(page([item(1)], 'after-1'))
      .mockReturnValueOnce(new Promise(resolve => { resolveOldPage = resolve }))
      .mockResolvedValueOnce(page([item(7, 'approved')]))

    const wrapper = mountApp()
    await flushPromises()
    pagerButton(wrapper, 'Next').trigger('click')
    await wrapper.vm.$router.push({ query: { status: 'reviewed' } })
    await flushPromises()
    resolveOldPage(page([item(2)], 'after-2'))
    await flushPromises()

    expect(fetchItems).toHaveBeenLastCalledWith({ status: 'reviewed' }, null)
    expect(titles(wrapper)).toEqual(['Item 7'])
    expect(wrapper.find('.queue__pager').exists()).toBe(false)
    wrapper.destroy()
  })

  it('opens the first item of the next page after reviewing the last item on a page', async () => {
    fetchItems.mockResolvedValueOnce(page([item(1), item(2)], 'after-2')).mockResolvedValueOnce(page([item(3), item(4)]))
    fetchItem.mockImplementation(async id => item(id))
    reviewItem.mockImplementation(async id => item(id, 'approved'))

    const wrapper = mountApp('/items/2')
    await flushPromises()
    await wrapper.findAll('.review-form button').wrappers.find(button => button.text() === 'Approve').trigger('click')
    await flushPromises()

    expect(fetchItems).toHaveBeenLastCalledWith({}, 'after-2')
    expect(titles(wrapper)).toEqual(['Item 3', 'Item 4'])
    expect(wrapper.vm.$route.params.id).toBe('3')
    wrapper.destroy()
  })

  it('waits for typing to pause, then replaces the URL and reloads with the search', async () => {
    fetchItems.mockResolvedValue(page([]))

    const wrapper = mountApp()
    await flushPromises()
    const replace = vi.spyOn(wrapper.vm.$router, 'replace')
    const input = wrapper.find('.queue-filters input')

    vi.useFakeTimers()
    await input.setValue('vol')
    await input.setValue('volcano')
    vi.advanceTimersByTime(299)
    expect(replace).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    vi.useRealTimers()
    await flushPromises()

    expect(replace).toHaveBeenCalledTimes(1)
    expect(wrapper.vm.$route.query).toEqual({ search: 'volcano' })
    expect(fetchItems).toHaveBeenLastCalledWith({ search: 'volcano' }, null)
    wrapper.destroy()
  })

  it('drops an item from the pending list when its conflict arrives after moving on', async () => {
    let rejectReview
    fetchItems.mockResolvedValue(page([item(1), item(2)]))
    fetchItem.mockImplementation(async id => item(id))
    reviewItem.mockReturnValue(new Promise((resolve, reject) => { rejectReview = reject }))

    const wrapper = mountApp('/items/1')
    await flushPromises()
    wrapper.findAll('.review-form button').wrappers.find(button => button.text() === 'Approve').trigger('click')
    await wrapper.vm.$router.push('/items/2')
    await flushPromises()
    rejectReview(new ApiError('This item has already been reviewed.', 409, {}, item(1, 'rejected')))
    await flushPromises()

    expect(titles(wrapper)).toEqual(['Item 2'])
    expect(wrapper.vm.$route.path).toBe('/items/2')
    wrapper.destroy()
  })

  it('drops a row from the pending list when opening it shows another reviewer already decided it', async () => {
    fetchItems.mockResolvedValue(page([item(1), item(2)]))
    fetchItem.mockImplementation(async id => item(id, id === 1 ? 'rejected' : 'pending'))

    const wrapper = mountApp('/items/1')
    await flushPromises()

    expect(titles(wrapper)).toEqual(['Item 2'])
    expect(wrapper.find('.item-detail__decision').text()).toContain('Rejected')
    wrapper.destroy()
  })

  it('does not auto-advance into a page that is being replaced', async () => {
    let resolveNextPage
    let resolveReview
    fetchItems
      .mockResolvedValueOnce(page([item(1), item(2)], 'after-2'))
      .mockReturnValueOnce(new Promise(resolve => { resolveNextPage = resolve }))
    fetchItem.mockImplementation(async id => item(id))
    reviewItem.mockReturnValue(new Promise(resolve => { resolveReview = resolve }))

    const wrapper = mountApp('/items/2')
    await flushPromises()
    wrapper.findAll('.review-form button').wrappers.find(button => button.text() === 'Approve').trigger('click')
    pagerButton(wrapper, 'Next').trigger('click')
    await flushPromises()
    resolveReview(item(2, 'approved'))
    await flushPromises()
    resolveNextPage(page([item(3), item(4)]))
    await flushPromises()

    expect(wrapper.vm.$route.path).toBe('/items/2')
    expect(titles(wrapper)).toEqual(['Item 3', 'Item 4'])
    wrapper.destroy()
  })

  it('removes a reviewed item from the pending list and opens the next one', async () => {
    fetchItems.mockResolvedValue(page([item(1), item(2), item(3)]))
    fetchItem.mockImplementation(async id => item(id))
    reviewItem.mockImplementation(async id => item(id, 'approved'))

    const wrapper = mountApp('/items/2')
    await flushPromises()
    const approve = wrapper.findAll('.review-form button').wrappers.find(button => button.text() === 'Approve')
    await approve.trigger('click')
    await flushPromises()

    expect(titles(wrapper)).toEqual(['Item 1', 'Item 3'])
    expect(wrapper.find('.queue__count').text()).toBe('2 items')
    expect(wrapper.vm.$route.params.id).toBe('3')
    wrapper.destroy()
  })
})
