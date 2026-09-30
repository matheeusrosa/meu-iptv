/**
 * IPTV Pro Brasil - Configurações Globais
 * Otimizado para máxima estabilidade, buffer anti-interrupções,
 * recuo seguro de 30s do ao vivo e backup DVR de 5 minutos de histórico.
 */
const IPTV_CONFIG = {
  appName: 'IPTV PRO BRASIL',
  version: '2.0.0',
  apiEndpoint: '/api/channels',
  proxyEndpoint: '/proxy?url=',
  defaultVolume: 0.9,
  storageKeys: {
    favorites: 'iptv_favorites_v5',
    volume: 'iptv_volume',
    recentChannel: 'iptv_last_channel',
    antiStallMode: 'iptv_anti_stall_active'
  },
  aspectRatios: [
    { id: 'fit-contain', label: 'Original (Ajustar)' },
    { id: 'fit-16-9', label: '16:9 Widescreen' },
    { id: 'fit-4-3', label: '4:3 Tradicional' },
    { id: 'fit-fill', label: 'Esticar Tela' },
    { id: 'fit-cover', label: 'Preencher (Zoom)' }
  ],
  // Configuração Estilo YouTube: Estabilidade Máxima, Super Buffer Contínuo e Zero Travamentos
  hlsOptions: {
    enableWorker: true,
    lowLatencyMode: false,
    backBufferLength: 30,          // Retém histórico recente em RAM
    maxBufferLength: 60,           // Puxa e acumula até 60 segundos de buffer à frente
    maxMaxBufferLength: 120,       // Teto elástico seguro
    maxBufferSize: 80 * 1000 * 1000,
    highBufferWatchdogPeriod: 2,   // Monitora a saúde do buffer a cada 2 segundos
    startLevel: -1,                // Auto ABR adaptativo (480p -> 720p -> 1080p sem travar)
    capLevelToPlayerSize: false,
    startFragPrefetch: true,       // Pré-carrega o próximo segmento sem pausas
    progressive: false,
    manifestLoadingTimeOut: 15000,
    manifestLoadingMaxRetry: 6,
    manifestLoadingRetryDelay: 500,
    levelLoadingTimeOut: 15000,
    levelLoadingMaxRetry: 6,
    fragLoadingTimeOut: 20000,
    fragLoadingMaxRetry: 4,        // Máximo 4 tentativas (evita congelar a fila em manifests rotativos)
    fragLoadingRetryDelay: 500,
    liveSyncDurationCount: 2,      // Inicia a 2 segmentos da borda ao vivo (garante disponibilidade de sinal)
    liveMaxLatencyDurationCount: 5,// Resincroniza suavemente se a queda ultrapassar a memória do servidor
    maxLiveSyncPlaybackRate: 1.0,  // Velocidade SEMPRE normal (1.0x) - sem acelerar áudio nem vídeo
    liveDurationInfinity: true,
    nudgeMaxRetry: 5,              // Pula micro-buracos de timestamp sem congelar a tela
    nudgeOffset: 0.2
  }
};
