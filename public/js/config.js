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
  // Configuração Anti-Travamento, Anti-Distorção e DVR da Engine HLS
  hlsOptions: {
    enableWorker: true,
    lowLatencyMode: false,         // Desativado: Modo de baixa latência agressivo causa engasgos em Wi-Fi oscilante
    backBufferLength: 120,         // Retém até 2 minutos de histórico recente para retorno suave
    maxBufferLength: 30,           // Mantém até 30s de buffer pré-carregado à frente
    maxMaxBufferLength: 60,        // Teto de 60s para absorver qualquer lentidão ou oscilação da operadora
    maxBufferSize: 60 * 1000 * 1000,
    startLevel: -1,                // Auto ABR com perfil HD estável
    capLevelToPlayerSize: true,    // Ajusta o bitrate de acordo com a resolução real da tela
    abrBandWidthFactor: 0.70,      // Margem de segurança de 30% de folga na banda contra oscilações de rede
    abrBandWidthUpFactor: 0.50,    // Subida conservadora: só sobe se a conexão for 100% estável
    abrEwmaDefaultEstimate: 2000000,// Inicia estimando 2.0 Mbps para carregamento rápido
    abrEwmaFastLive: 3.0,
    abrEwmaSlowLive: 9.0,          // Média móvel suave que evita troca histérica de qualidade
    startFragPrefetch: true,       // Pré-carrega o próximo segmento sem gerar pausas
    progressive: false,            // Garante integridade dos pacotes MPEG-TS (elimina o efeito embaralhado)
    manifestLoadingTimeOut: 15000,
    manifestLoadingMaxRetry: 5,
    manifestLoadingRetryDelay: 500,
    levelLoadingTimeOut: 15000,
    levelLoadingMaxRetry: 5,
    fragLoadingTimeOut: 18000,
    fragLoadingMaxRetry: 6,
    fragLoadingRetryDelay: 600,
    liveSyncDurationCount: 3,      // Sincronização inteligente a 3 segmentos da borda ao vivo (compatível com todas as emissoras)
    liveMaxLatencyDurationCount: 8,// Auto-reconexão inteligente à transmissão caso a internet oscile
    maxLiveSyncPlaybackRate: 1.1,  // Suave recuperação de atraso sem saltos bruscos
    liveDurationInfinity: true,    // Trata como DVR contínuo
    nudgeOffset: 0.2,              // Salta pequenas lacunas de timestamps do sinal da emissora
    nudgeMaxRetry: 10
  }
};
