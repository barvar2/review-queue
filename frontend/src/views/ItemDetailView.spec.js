import { createLocalVue, mount } from '@vue/test-utils'
import VueRouter from 'vue-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ElementPlugin from '../plugins/element'
import App from '../App.vue'
import { ApiError } from '../api/client'
import { fetchItem, fetchItems, reviewItem } from '../api/items'
import { routes } from '../router'

vi.mock('../api/items', () => ({ fetchItems: vi.fn(), fetchItem: vi.fn(), reviewItem: vi.fn() }))

const localVue = createLocalVue()
localVue.use(VueRouter)
localVue.use(ElementPlugin)

function detail(overrides = {}) {
  return {
    id: 1,
    title: 'Video freezes',
    body: 'The video stops after ten seconds.',
    status: 'pending',
    flags: [],
    review_note: null,
    reviewed_at: null,
    created_at: '2026-10-22T10:00:00Z',
    ...overrides
  }
}

function flushPromises() {
  return new Promise(resolve => setTimeout(resolve))
}

async function mountDetail(path = '/items/1?status=all') {
  const router = new VueRouter({ mode: 'abstract', routes })
  router.push(path)
  const wrapper = mount(App, { localVue, router, attachTo: document.body })
  await flushPromises()
  return wrapper
}

async function submitReview(wrapper, label, note) {
  await wrapper.find('#review-note').setValue(note)
  const button = wrapper.findAll('.review-form button').wrappers.find(candidate => candidate.text() === label)
  await button.trigger('click')
  await flushPromises()
}

describe('ItemDetailView', () => {
  beforeEach(() => {
    fetchItems.mockResolvedValue({ items: [], nextCursor: null, total: 0, pageSize: 25 })
  })

  afterEach(() => {
    vi.resetAllMocks()
    document.body.innerHTML = ''
  })

  it('renders submitted content as text, never as HTML', async () => {
    const body = '<img src=x onerror="alert(1)"><b>bold</b>'
    fetchItem.mockResolvedValue(detail({ body }))

    const wrapper = await mountDetail()

    expect(wrapper.find('.item-detail__body').text()).toBe(body)
    expect(wrapper.find('.item-detail__body img').exists()).toBe(false)
    wrapper.destroy()
  })

  it('lists each moderation flag with its reason', async () => {
    fetchItem.mockResolvedValue(detail({
      flags: [{ code: 'links', label: 'Links', reason: 'Contains 2 links' }]
    }))

    const wrapper = await mountDetail()
    const row = wrapper.find('.item-detail__flag-list li')

    expect(row.find('.el-tag').text()).toBe('Links')
    expect(row.text()).toContain('Contains 2 links')
    wrapper.destroy()
  })

  it('submits the review and shows the recorded decision', async () => {
    fetchItem.mockResolvedValue(detail())
    reviewItem.mockResolvedValue(detail({ status: 'approved', review_note: 'Looks fine', reviewed_at: '2026-10-22T11:00:00Z' }))

    const wrapper = await mountDetail()
    await submitReview(wrapper, 'Approve', 'Looks fine')

    expect(reviewItem).toHaveBeenCalledWith(1, { decision: 'approve', note: 'Looks fine' })
    expect(wrapper.find('.item-detail__decision').text()).toContain('Approved')
    wrapper.destroy()
  })

  it('shows the other decision and the unsaved note on a conflict, without navigating', async () => {
    fetchItems.mockResolvedValue({ items: [detail(), detail({ id: 2 })], nextCursor: null, total: 2, pageSize: 25 })
    fetchItem.mockResolvedValue(detail())
    reviewItem.mockRejectedValue(new ApiError('This item has already been reviewed.', 409, {}, detail({ status: 'rejected' })))

    const wrapper = await mountDetail('/items/1')
    await submitReview(wrapper, 'Approve', 'My note')

    expect(wrapper.find('.item-detail__conflict').text()).toContain('already rejected by another reviewer')
    expect(wrapper.find('.item-detail__conflict').text()).toContain('Your note: "My note"')
    expect(wrapper.vm.$route.fullPath).toBe('/items/1')
    wrapper.destroy()
  })

  it('keeps the unsaved note when the request fails', async () => {
    fetchItem.mockResolvedValue(detail())
    reviewItem.mockRejectedValue(new ApiError('Could not reach the server.', 0))

    const wrapper = await mountDetail()
    await submitReview(wrapper, 'Reject', 'Keep me')

    expect(wrapper.find('#review-note').element.value).toBe('Keep me')
    expect(wrapper.find('.review-form .el-alert__title').text()).toBe('Could not reach the server.')
    wrapper.destroy()
  })
})
