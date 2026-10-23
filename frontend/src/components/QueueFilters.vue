<template>
  <div class="queue-filters">
    <el-tabs :value="value.status" class="queue-filters__tabs" @input="update('status', $event)">
      <el-tab-pane v-for="option in statusOptions" :key="option.value" :label="option.label" :name="option.value" />
    </el-tabs>

    <el-input
      :value="searchText"
      size="small"
      :placeholder="messages.filters.searchPlaceholder"
      :aria-label="messages.filters.searchPlaceholder"
      prefix-icon="el-icon-search"
      maxlength="100"
      clearable
      @input="onSearchInput"
    />

    <div class="queue-filters__row">
      <el-select :value="value.sort" size="small" class="queue-filters__sort" :aria-label="messages.filters.sortLabel" @input="update('sort', $event)">
        <el-option v-for="option in sortOptions" :key="option.value" :label="option.label" :value="option.value" />
      </el-select>

      <el-checkbox :value="value.flaggedOnly" border size="small" @input="update('flaggedOnly', $event)">
        {{ messages.filters.flaggedOnly }}
      </el-checkbox>
    </div>
  </div>
</template>

<script>
import { MESSAGES } from '../constants/messages'
import { SORT_OPTIONS, STATUS_OPTIONS } from '../queueFilters'

const SEARCH_DEBOUNCE_MS = 300

export default {
  name: 'QueueFilters',

  props: {
    value: { type: Object, required: true }
  },

  data() {
    return {
      messages: MESSAGES,
      statusOptions: STATUS_OPTIONS,
      sortOptions: SORT_OPTIONS,
      searchText: this.value.search,
      searchTimer: null
    }
  },

  watch: {
    'value.search'(search) {
      clearTimeout(this.searchTimer)
      this.searchText = search
    }
  },

  beforeDestroy() {
    clearTimeout(this.searchTimer)
  },

  methods: {
    update(key, newValue) {
      clearTimeout(this.searchTimer)
      this.$emit('input', { ...this.value, search: this.searchText, [key]: newValue })
    },

    onSearchInput(search) {
      this.searchText = search
      clearTimeout(this.searchTimer)
      this.searchTimer = setTimeout(() => this.$emit('search', search), SEARCH_DEBOUNCE_MS)
    }
  }
}
</script>

<style scoped lang="scss">
@use '../styles/variables' as *;

.queue-filters {
  display: flex;
  flex-direction: column;
  gap: $space-3;

  &__tabs ::v-deep .el-tabs__header {
    margin: 0;
  }

  &__row {
    display: flex;
    gap: $space-2;
  }

  &__sort {
    flex: 1;
  }
}
</style>
