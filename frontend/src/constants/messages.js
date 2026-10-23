const itemCount = (count, capped = false) => {
  if (capped) return `${count.toLocaleString('en')}+ items`
  return count === 1 ? '1 item' : `${count.toLocaleString('en')} items`
}

export const MESSAGES = Object.freeze({
  app: {
    name: 'Review Queue',
    queueLink: 'Queue',
    submitLink: 'Submit item'
  },

  common: {
    retry: 'Retry',
    justNow: 'just now'
  },

  errors: {
    network: 'Could not reach the server. Check your connection and try again.',
    server: 'Something went wrong on our side. Please try again.',
    itemNotFound: 'This item does not exist or was removed.'
  },

  status: {
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected'
  },

  filters: {
    statusTabs: {
      pending: 'Pending',
      reviewed: 'Reviewed',
      all: 'All'
    },
    sortOptions: {
      oldest: 'Oldest first',
      newest: 'Newest first'
    },
    searchPlaceholder: 'Search title or content',
    sortLabel: 'Sort',
    flaggedOnly: 'Flagged only'
  },

  queue: {
    title: 'Review queue',
    subtitle: 'Approve or reject submitted items. Suspicious content is flagged automatically to help you decide.',
    listLabel: 'Queue',
    detailLabel: 'Item details',
    loadError: "Couldn't load the queue",
    loading: 'Loading…',
    itemCount,
    pageSummary: (page, pages, count, capped) => `Page ${page} of ${pages}${capped ? '+' : ''} · ${itemCount(count, capped)}`,
    paginationLabel: 'Pages',
    previousPage: 'Previous',
    nextPage: 'Next',
    pageEmpty: 'No more items on this page.',
    clearSearch: 'Clear search',
    noMatches: search => `No items match "${search}".`,
    empty: {
      pending: 'No pending items. The queue is clear.',
      reviewed: 'No reviewed items yet.',
      all: 'No items yet.'
    },
    selectItem: 'Select an item from the queue to review it.',
    endOfQueue: 'You reached the end of the pending queue.'
  },

  item: {
    loadError: "Couldn't load this item",
    backToQueue: 'Back to queue',
    submittedAgo: time => `Submitted ${time}`,
    flagsTitle: 'Moderation flags',
    noFlags: 'No flags raised.',
    flagsHint: 'Flags are automated hints. The decision is always yours.',
    decisionTitle: 'Decision',
    statusLabel: 'Status',
    reviewedLabel: 'Reviewed',
    noteLabel: 'Note',
    noNote: 'No note'
  },

  review: {
    noteLabel: 'Review note (optional)',
    notePlaceholder: 'Add a note for this decision (optional)',
    approve: 'Approve',
    reject: 'Reject',
    approved: 'Item approved.',
    rejected: 'Item rejected.',
    conflictTitle: status => `This item was already ${status} by another reviewer.`,
    conflictWithNote: note => `Your decision and note were not saved. Your note: "${note}"`,
    conflictWithoutNote: 'Your decision was not saved.'
  },

  submit: {
    title: 'Submit an item',
    subtitle: 'Report an issue or share feedback. A reviewer will look at it shortly.',
    titleLabel: 'Title',
    titlePlaceholder: 'A short summary',
    titleRequired: 'Title is required.',
    bodyLabel: 'Content',
    bodyPlaceholder: 'Describe the issue or feedback in detail',
    bodyRequired: 'Content is required.',
    requiredHint: 'Both fields are required.',
    submitButton: 'Submit for review',
    success: 'Item submitted for review.',
    nextStepsTitle: 'What happens next',
    nextSteps: [
      { title: 'Queued.', text: 'Your item is added to the review queue immediately.' },
      { title: 'Reviewed.', text: 'A reviewer reads it and approves or rejects it.' },
      { title: 'Decided.', text: 'The decision is recorded, optionally with a reviewer note.' }
    ]
  }
})
