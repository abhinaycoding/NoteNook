export const ARCHETYPES = [
  { id: 'owl', name: 'The Night Owl', emoji: '🦉', desc: 'Flows best after dark.' },
  { id: 'coffee', name: 'The Caffeine Fiend', emoji: '☕', desc: 'Powered by espresso.' },
  { id: 'book', name: 'The Bookworm', emoji: '📚', desc: 'Thrives in deep theory.' },
  { id: 'creative', name: 'The Creative', emoji: '🎨', desc: 'Visualizing the solution.' },
  { id: 'achiever', name: 'The High Achiever', emoji: '🚀', desc: 'Targeting the 99th percentile.' },
  { id: 'researcher', name: 'The Researcher', emoji: '🧠', desc: 'Connecting the dots.' },
  { id: 'default', name: 'The Scholar', emoji: '📖', desc: 'A dedicated student.' }
]

export const getArchetype = (id) => ARCHETYPES.find(a => a.id === id) || ARCHETYPES[6]
