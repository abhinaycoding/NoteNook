export const ZEN_TRACKS = [
  { id: 'lofi', name: 'Lofi Beats', url: 'https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3' },
  { id: 'rain', name: 'Rain Sounds', url: 'https://cdn.pixabay.com/audio/2021/08/04/audio_0625c1539c.mp3' },
  { id: 'coffee', name: 'Coffee Shop', url: 'https://cdn.pixabay.com/audio/2022/11/22/audio_febc508520.mp3' }
]

export const getZenTrack = (id) => ZEN_TRACKS.find(t => t.id === id) || ZEN_TRACKS[0]
