export const ARCHETYPES = [
  { id: 'owl', name: 'The Night Owl', emoji: '🦉', desc: 'Flows best after dark.', accent: '#6366f1' },
  { id: 'coffee', name: 'The Caffeine Fiend', emoji: '☕', desc: 'Powered by espresso.', accent: '#a16207' },
  { id: 'book', name: 'The Bookworm', emoji: '📚', desc: 'Thrives in deep theory.', accent: '#0891b2' },
  { id: 'creative', name: 'The Creative', emoji: '🎨', desc: 'Visualizing the solution.', accent: '#db2777' },
  { id: 'achiever', name: 'The High Achiever', emoji: '🚀', desc: 'Targeting the 99th percentile.', accent: '#ea580c' },
  { id: 'researcher', name: 'The Researcher', emoji: '🧠', desc: 'Connecting the dots.', accent: '#7c3aed' },
  { id: 'default', name: 'The Scholar', emoji: '📖', desc: 'A dedicated student.', accent: '#059669' }
]

export const getArchetype = (id) => ARCHETYPES.find(a => a.id === id) || ARCHETYPES[6]
