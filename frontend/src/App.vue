<template>
  <div class="app">
    <header class="app-bar">
      <router-link to="/" class="app-bar__brand">
        <span class="app-bar__logo"><i class="el-icon-finished" /></span>
        {{ messages.app.name }}
      </router-link>
      <nav class="app-bar__nav">
        <router-link
          class="app-bar__link"
          :class="{ 'router-link-active': $route.name === 'item' }"
          to="/"
          exact
        >
          {{ messages.app.queueLink }}
        </router-link>
        <router-link class="app-bar__link" to="/submit">{{ messages.app.submitLink }}</router-link>
      </nav>
    </header>
    <main class="app__main">
      <router-view />
    </main>
  </div>
</template>

<script>
import { MESSAGES } from './constants/messages'

export default {
  name: 'App',

  data() {
    return {
      messages: MESSAGES
    }
  }
}
</script>

<style scoped lang="scss">
@use './styles/variables' as *;

.app {
  display: flex;
  flex-direction: column;
  height: 100vh;

  &__main {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
  }

  @media (max-width: $breakpoint-md) {
    height: auto;
    min-height: 100vh;

    &__main {
      overflow: visible;
    }
  }
}

.app-bar {
  display: flex;
  flex-shrink: 0;
  gap: $space-6;
  align-items: center;
  height: $header-height;
  padding: 0 $space-6;
  background: #fff;
  border-bottom: 1px solid $gray-200;

  &__brand {
    display: flex;
    gap: $space-2;
    align-items: center;
    font-size: $font-size-lg;
    font-weight: 600;
    color: $gray-900;

    &:hover {
      text-decoration: none;
    }
  }

  &__logo {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    color: #fff;
    background: $color-primary;
    border-radius: $radius;
  }

  &__nav {
    display: flex;
    gap: $space-1;
  }

  &__link {
    padding: 6px $space-3;
    font-weight: 500;
    color: $gray-500;
    border-radius: $radius;

    &:hover {
      color: $gray-900;
      text-decoration: none;
      background: $gray-100;
    }

    &.router-link-active {
      color: $color-primary;
      background: $color-primary-soft;
    }
  }

  @media (max-width: $breakpoint-md) {
    gap: $space-3;
    padding: 0 $space-4;
  }
}
</style>
