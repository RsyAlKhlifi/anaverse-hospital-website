/**
 * Titik integrasi konsultasi video.
 * Implementasikan VideoProvider (mis. Daily, LiveKit, Twilio, Jitsi), lalu daftarkan di `videoProvider`.
 * Kolom `consultations.channel` ('chat' | 'video') dan `video_room_url` sudah disiapkan di skema.
 */
export interface VideoProvider {
  name: string
  createRoom(consultationId: string): Promise<{ joinUrl: string }>
}

export let videoProvider: VideoProvider | null = null

export function registerVideoProvider(p: VideoProvider) {
  videoProvider = p
}
