<template>
  <div class="queue-page" :class="{ 'queue-page--has-selection': selectedId !== null }">
    <header class="page-header">
      <h1 class="page-header__title">{{ messages.queue.title }}</h1>
      <p class="page-header__subtitle">{{ messages.queue.subtitle }}</p>
    </header>

    <div class="queue">
      <section class="queue__pane" :aria-label="messages.queue.listLabel">
        <div class="queue__filters">
          <queue-filters :value="filters" @input="updateFilters" @search="updateSearch" />
        </div>
        <p v-if="!error" class="queue__count" aria-live="polite">{{ countLabel }}</p>

        <async-state
          ref="list"
          class="queue__list"
          :loading="refreshing"
          :error="error"
          :error-title="messages.queue.loadError"
          :empty="!loading && items.length === 0"
          @retry="loadPage"
        >
          <div v-if="loading && items.length === 0" aria-hidden="true">
            <el-skeleton v-for="row in 5" :key="row" :rows="2" class="queue__skeleton" />
          </div>

          <ul v-else class="queue__items">
            <li v-for="item in items" :key="item.id" class="queue__item">
              <router-link class="queue__link" :to="itemLink(item.id)">
                <queue-item :item="item" :selected="item.id === selectedId" />
              </router-link>
            </li>
          </ul>

          <template #empty>
            <el-empty :description="emptyMessage" :image-size="48">
              <template #image>
                <span class="queue__icon"><i :class="emptyIcon" /></span>
              </template>
              <el-button v-if="filters.search" size="small" @click="clearSearch">{{ messages.queue.clearSearch }}</el-button>
            </el-empty>
          </template>
        </async-state>

        <nav v-if="hasPreviousPage || nextCursor" class="queue__pager" :aria-label="messages.queue.paginationLabel">
          <el-button size="small" icon="el-icon-arrow-left" :disabled="!hasPreviousPage || loading" @click="showPreviousPage">
            {{ messages.queue.previousPage }}
          </el-button>
          <el-button size="small" :disabled="!nextCursor || loading" @click="showNextPage">
            {{ messages.queue.nextPage }}<i class="el-icon-arrow-right el-icon--right" />
          </el-button>
        </nav>
      </section>

      <section class="queue__detail" :aria-label="messages.queue.detailLabel">
        <router-view @reviewed="onItemReviewed" @item-changed="onItemChanged" />
        <el-empty
          v-if="selectedId === null"
          class="queue__placeholder"
          :description="messages.queue.selectItem"
          :image-size="56"
        >
          <template #image>
            <span class="queue__icon"><i class="el-icon-document" /></span>
          </template>
        </el-empty>
      </section>
    </div>
  </div>
</template>

<script>
import { isNavigationFailure } from 'vue-router'
import { fetchItems } from '../api/items'
import { MESSAGES } from '../constants/messages'
import { filtersFromQuery, queryFromFilters } from '../queueFilters'
import AsyncState from '../components/AsyncState.vue'
import QueueFilters from '../components/QueueFilters.vue'
import QueueItem from '../components/QueueItem.vue'

export default {
  name: 'QueueView',

  components: { AsyncState, QueueFilters, QueueItem },

  data() {
    return {
      messages: MESSAGES,
      items: [],
      cursor: null,
      previousCursors: [],
      nextCursor: null,
      total: 0,
      totalCapped: false,
      pageSize: 1,
      loading: false,
      error: '',
      listVersion: 0
    }
  },

  computed: {
    filters() {
      return filtersFromQuery(this.$route.query)
    },

    apiQuery() {
      return queryFromFilters(this.filters)
    },

    selectedId() {
      return this.$route.params.id ? Number(this.$route.params.id) : null
    },

    filtersKey() {
      return JSON.stringify(this.filters)
    },

    refreshing() {
      return this.loading && this.items.length > 0
    },

    hasPreviousPage() {
      return this.previousCursors.length > 0
    },

    pageNumber() {
      return this.previousCursors.length + 1
    },

    pageCount() {
      const reachable = this.pageNumber + (this.nextCursor ? 1 : 0)
      return Math.max(reachable, Math.ceil(this.total / this.pageSize))
    },

    emptyIcon() {
      return this.filters.search ? 'el-icon-search' : 'el-icon-circle-check'
    },

    countLabel() {
      if (this.loading && this.items.length === 0) return MESSAGES.queue.loading
      if (this.pageCount > 1) return MESSAGES.queue.pageSummary(this.pageNumber, this.pageCount, this.total, this.totalCapped)
      return MESSAGES.queue.itemCount(this.total, this.totalCapped)
    },

    emptyMessage() {
      if (this.hasPreviousPage) return MESSAGES.queue.pageEmpty

      return this.filters.search
        ? MESSAGES.queue.noMatches(this.filters.search)
        : MESSAGES.queue.empty[this.filters.status]
    }
  },

  watch: {
    filtersKey: {
      immediate: true,
      handler() {
        this.showFirstPage()
      }
    }
  },

  methods: {
    async loadPage() {
      const version = ++this.listVersion
      this.loading = true
      this.error = ''

      try {
        const page = await fetchItems(this.apiQuery, this.cursor)
        if (version !== this.listVersion) return
        this.items = page.items
        this.nextCursor = page.nextCursor
        this.total = page.total
        this.totalCapped = page.totalCapped
        this.pageSize = page.pageSize
      } catch (error) {
        if (version !== this.listVersion) return
        this.items = []
        this.nextCursor = null
        this.total = 0
        this.totalCapped = false
        this.error = error.message
      } finally {
        if (version === this.listVersion) this.loading = false
      }
    },

    showFirstPage() {
      this.cursor = null
      this.previousCursors = []
      return this.loadPage()
    },

    async showNextPage() {
      if (!this.nextCursor || this.loading) return

      this.previousCursors = [...this.previousCursors, this.cursor]
      this.cursor = this.nextCursor
      await this.loadPage()
      this.scrollListToTop()
    },

    async showPreviousPage() {
      if (!this.hasPreviousPage || this.loading) return

      this.cursor = this.previousCursors[this.previousCursors.length - 1]
      this.previousCursors = this.previousCursors.slice(0, -1)
      await this.loadPage()
      this.scrollListToTop()
    },

    scrollListToTop() {
      this.$refs.list.$el.scrollTop = 0
    },

    updateFilters(filters) {
      this.navigate(filters, 'push')
    },

    updateSearch(search) {
      this.navigate({ ...this.filters, search }, 'replace')
    },

    clearSearch() {
      this.navigate({ ...this.filters, search: '' }, 'push')
    },

    navigate(filters, method) {
      this.goTo({ query: queryFromFilters(filters) }, method)
    },

    itemLink(id) {
      return { name: 'item', params: { id: String(id) }, query: this.$route.query }
    },

    goTo(location, method = 'push') {
      this.$router[method](location).catch(error => {
        if (!isNavigationFailure(error)) throw error
      })
    },

    applyItemUpdate(updated) {
      const index = this.items.findIndex(item => item.id === updated.id)
      if (index === -1 || this.items[index].status === updated.status) return index

      if (this.filters.status === 'pending' && updated.status !== 'pending') {
        this.items = this.items.filter(item => item.id !== updated.id)
        if (!this.totalCapped) this.total = Math.max(0, this.total - 1)
      } else {
        this.items = this.items.map(item => (item.id === updated.id ? { ...item, status: updated.status } : item))
      }

      return index
    },

    refillIfEmpty() {
      if (this.items.length === 0 && !this.error && (this.hasPreviousPage || this.nextCursor)) {
        this.loadPage()
      }
    },

    onItemChanged(updated) {
      this.applyItemUpdate(updated)
      this.refillIfEmpty()
    },

    async onItemReviewed(reviewed) {
      const index = this.applyItemUpdate(reviewed)

      if (this.filters.status === 'pending' && index !== -1 && !this.loading) {
        await this.openNextPending(index)
      }
    },

    async openNextPending(index) {
      let next = this.items[index]

      if (!next && this.nextCursor) {
        await this.showNextPage()
        next = this.items[0]
      }

      if (next) {
        this.goTo(this.itemLink(next.id))
        return
      }

      if (!this.error) this.$message.info(MESSAGES.queue.endOfQueue)
      this.goTo({ name: 'queue', query: this.$route.query })
      this.refillIfEmpty()
    }
  }
}
</script>

<style scoped lang="scss">
@use '../styles/variables' as *;

.queue-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-width: 1440px;
  margin: 0 auto;
  padding: $space-6;
}

.queue {
  display: grid;
  flex: 1 1 auto;
  grid-template-columns: $queue-width minmax(0, 1fr);
  gap: $space-5;
  min-height: 0;

  &__pane,
  &__detail {
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
    background: #fff;
    border: 1px solid $gray-200;
    border-radius: $radius-lg;
  }

  &__filters {
    padding: $space-2 $space-5 $space-4;
  }

  &__count {
    margin: 0;
    padding: $space-2 $space-5;
    font-size: $font-size-xs;
    font-weight: 500;
    color: $gray-500;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    background: $gray-50;
    border-top: 1px solid $gray-200;
    border-bottom: 1px solid $gray-200;
  }

  &__list {
    flex: 1;
    overflow-y: auto;
  }

  &__items {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  &__item,
  &__skeleton {
    border-bottom: 1px solid $gray-100;
  }

  &__skeleton {
    padding: $space-4 $space-5;
  }

  &__link {
    display: block;
    color: inherit;

    &:hover {
      text-decoration: none;
      background: $gray-50;
    }

    &:focus-visible {
      outline: 2px solid $color-primary;
      outline-offset: -2px;
    }
  }

  &__pager {
    display: flex;
    flex-shrink: 0;
    justify-content: space-between;
    padding: $space-3 $space-5;
    border-top: 1px solid $gray-200;
  }

  &__placeholder {
    margin: auto;
  }

  &__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    aspect-ratio: 1;
    font-size: 22px;
    color: $color-primary;
    background: $color-primary-soft;
    border-radius: 50%;
  }
}

@media (max-width: $breakpoint-md) {
  .queue-page {
    height: auto;
    padding: $space-4;
  }

  .page-header__subtitle {
    display: none;
  }

  .queue {
    grid-template-columns: minmax(0, 1fr);

    &__pane,
    &__detail {
      overflow: visible;
    }
  }

  .queue-page--has-selection .queue__pane,
  .queue-page:not(.queue-page--has-selection) .queue__detail {
    display: none;
  }
}
</style>
