export const ZEN_TRACKS = [
  { id: 'lofi', name: 'Lofi Beats', url: '/zen/lofi.mp3' },
  { id: 'rain', name: 'Rain Sounds', url: '/zen/rain.mp3' },
  { id: 'coffee', name: 'Coffee Shop', url: '/zen/coffee.mp3' }
]

export const getZenTrack = (id) => ZEN_TRACKS.find(t => t.id === id) || ZEN_TRACKS[0]
