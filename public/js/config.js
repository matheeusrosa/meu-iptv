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
  // Configuração Estilo YouTube: Estabilidade Máxima, Super Buffer Contínuo e Zero Saltos
  hlsOptions: {
    enableWorker: true,
    lowLatencyMode: false,
    backBufferLength: 60,          // Retém 1 minuto de histórico em RAM
    maxBufferLength: 90,           // Puxa e acumula até 90 segundos de buffer à frente da transmissão
    maxMaxBufferLength: 180,       // Teto elástico de até 180 segundos para reter o máximo de sinal
    maxBufferSize: 120 * 1000 * 1000, // Permite até 120 MB de reserva de vídeo na memória
    highBufferWatchdogPeriod: 1,   // Monitora a saúde do buffer a cada 1 segundo (alimentação contínua)
    startLevel: -1,                // Auto ABR adaptativo
    capLevelToPlayerSize: false,   // Máxima resolução disponível sem restrição
    startFragPrefetch: true,       // Pré-carrega o próximo segmento continuamente sem pausas
    progressive: false,
    manifestLoadingTimeOut: 20000,
    manifestLoadingMaxRetry: 8,
    manifestLoadingRetryDelay: 800,
    levelLoadingTimeOut: 20000,
    levelLoadingMaxRetry: 8,
    fragLoadingTimeOut: 25000,
    fragLoadingMaxRetry: 10,
    fragLoadingRetryDelay: 1000,
    liveSyncDurationCount: 3,      // Inicia a 3 segmentos da borda ao vivo
    liveMaxLatencyDuration: Infinity,      // Estilo YouTube: Se cair 5s, mantém 5s atrás sem pular ou engasgar
    liveMaxLatencyDurationCount: Infinity, // Nunca força avanço automático abrupto
    maxLiveSyncPlaybackRate: 1.0,  // Velocidade SEMPRE normal (1.0x) - sem acelerar áudio nem vídeo
    liveDurationInfinity: true,    // Trata como streaming contínuo sem fim
    nudgeMaxRetry: 0               // Desativa saltos forçados de timestamp (elimina vai-e-volta)
  }
};
